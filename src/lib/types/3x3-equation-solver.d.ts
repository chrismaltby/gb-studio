declare module "3x3-equation-solver" {
  function solveEquations(
    input: number[][],
    detailedSolution?: boolean
  ): number[];
  export = solveEquations;
}
