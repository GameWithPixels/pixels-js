export interface UpdateArgs {
  time: number;
  deltaTime: number;
}

export type UpdateCallback = (args: Readonly<UpdateArgs>) => void;
