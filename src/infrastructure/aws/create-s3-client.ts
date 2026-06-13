import type { AwsCredentialIdentity, AwsCredentialIdentityProvider } from "@aws-sdk/types";
import { S3Client } from "@aws-sdk/client-s3";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";

function isRunningOnAws(): boolean {
    return Boolean(
        process.env.AWS_EXECUTION_ENV
        || process.env.ECS_CONTAINER_METADATA_URI
        || process.env.AWS_LAMBDA_FUNCTION_NAME,
    );
}

function getBootstrapCredentials(): AwsCredentialIdentity | undefined {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

    if (!accessKeyId || !secretAccessKey) {
        return undefined;
    }

    return {
        accessKeyId,
        secretAccessKey,
        ...(process.env.AWS_SESSION_TOKEN
            ? { sessionToken: process.env.AWS_SESSION_TOKEN }
            : {}),
    };
}

function fromAssumedRole(
    roleArn: string,
    bootstrapCredentials: AwsCredentialIdentity,
): AwsCredentialIdentityProvider {
    return async () => {
        const sts = new STSClient({
            region: process.env.AWS_REGION ?? "us-east-1",
            credentials: bootstrapCredentials,
        });

        const response = await sts.send(new AssumeRoleCommand({
            RoleArn: roleArn,
            RoleSessionName: "ingestion",
        }));

        const credentials = response.Credentials;
        if (!credentials?.AccessKeyId || !credentials.SecretAccessKey) {
            throw new Error(`Failed to assume role: ${roleArn}`);
        }

        return {
            accessKeyId: credentials.AccessKeyId,
            secretAccessKey: credentials.SecretAccessKey,
            sessionToken: credentials.SessionToken,
            expiration: credentials.Expiration,
        };
    };
}

export function createS3Client(): S3Client {
    const region = process.env.AWS_REGION ?? "us-east-1";
    const roleArn = process.env.AWS_ROLE_ARN;
    const bootstrapCredentials = getBootstrapCredentials();

    if (roleArn && bootstrapCredentials) {
        return new S3Client({
            region,
            credentials: fromAssumedRole(roleArn, bootstrapCredentials),
        });
    }

    if (roleArn) {
        if (!isRunningOnAws()) {
            throw new Error(
                "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required locally when AWS_ROLE_ARN is set",
            );
        }

        return new S3Client({
            region,
            credentials: fromTemporaryCredentials({
                params: {
                    RoleArn: roleArn,
                    RoleSessionName: "ingestion",
                },
            }),
        });
    }

    if (bootstrapCredentials) {
        return new S3Client({ region, credentials: bootstrapCredentials });
    }

    return new S3Client({ region });
}
