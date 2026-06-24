import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeBallImpacts } from "@/contexts/statistic/domain/computation/shared/wpa-utils";

function expectClose(actual: number, expected: number): void {
    assert.ok(Math.abs(actual - expected) < 1e-9, `Expected ${actual} to be close to ${expected}`);
}

describe("wpa-utils", () => {
    it("computes batting and bowling impacts from consecutive win probabilities", () => {
        const impacts = computeBallImpacts([0.4, 0.5, 0.3]);

        expectClose(impacts.battingImpact[0], 0.1);
        expectClose(impacts.battingImpact[1], -0.2);
        assert.equal(impacts.battingImpact[2], 0);
        expectClose(impacts.bowlingImpact[0], -0.1);
        expectClose(impacts.bowlingImpact[1], 0.2);
        assert.equal(impacts.bowlingImpact[2], 0);
    });
});
