export { Pos, RNG }

/**
 * Represents a 2D position.
 */
class Pos {
    constructor(public readonly x: number = 0, public readonly y: number = 0) { }
    add = (b: Pos) => new Pos(this.x + b.x, this.y + b.y)
    rotate = (pivot: Pos) => (direction: number) => {
        const newX = pivot.x + (direction) * (pivot.y - this.y);
        const newY = pivot.y - (direction) * (pivot.x - this.x);
        return new Pos(newX, newY);
    }
  }

/**
 * A random number generator which provides two pure functions
 * `hash` and `scale`
 */
abstract class RNG {
    // LCG using GCC's constants
    private static m = 0x80000000; // 2**31
    private static a = 1103515245;
    private static c = 12345;

    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed 
     * @returns a hash of the seed
     */
    public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

    /**
     * Takes hash value and scales it to the range [1, 7]
     */
    public static scale = (hash: number) =>  {
        const scaledValue = (hash / (RNG.m - 1));
        const scaledTetroNumber = Math.floor(scaledValue * 7) + 1;  // ensure the number is within range
        return scaledTetroNumber;
    }
}
