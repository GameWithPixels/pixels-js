export interface UniqueData {
  uuid: string;
  parentUuid?: string;
}

export interface UniqueNamedData extends UniqueData {
  name: string;
}
