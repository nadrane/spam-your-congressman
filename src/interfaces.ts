export interface TwilioIncomingMessage {
  ToCountry: string;
  ToState: string;
  SmsMessageSid: string;
  NumMedia: string;
  ToCity: string;
  FromZip: string;
  SmsSid: string;
  FromState: string;
  SmsStatus: string;
  FromCity: string;
  Body: string;
  FromCountry: string;
  To: string;
  ToZip: string;
  NumSegments: string;
  MessageSid: string;
  AccountSid: string;
  From: string;
  ApiVersion: string;
}

export enum Stage {
  GATHER_ADDRESS = "GATHER_ADDRESS",
  GATHER_MESSAGE = "GATHER_MESSAGE",
  QUEUED_MESSAGE = "QUEUED_MESSAGE"
}

export interface CongressPerson {
  id: string;
  title: string;
  short_title: string;
  api_uri: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  party: string;
  leadership_role: null;
  twitter_account: string;
  facebook_account: string;
  govtrack_id: string;
  cspan_id: string;
  votesmart_id: string;
  icpsr_id: string;
  crp_id: string;
  google_entity_id: string;
  fec_candidate_id: string;
  url: string;
  rss_url: string;
  in_office: true;
  dw_nominate: number;
  seniority: string;
  next_election: string;
  total_votes: number;
  missed_votes: number;
  total_present: number;
  last_updated: string;
  ocd_id: string;
  office: string;
  phone: string;
  state: string;
  district: string;
  at_large: false;
  geoid: string;
  missed_votes_pct: number;
  votes_with_party_pct: number;
}

export interface QueuedMessage {
  to: string;
  originalCaller: string;
}

export type Congress = Array<CongressPerson>;
