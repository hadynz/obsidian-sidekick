export interface SidekickSettings{
  enableStemming: boolean;
  matchTags: boolean;
  matchUnresolved: boolean;
  keywordsFilter: string;
}

export const DEFAULT_SETTINGS: SidekickSettings = {
  enableStemming: true,
  matchTags: true,
  matchUnresolved: true,
  keywordsFilter: ""
}
