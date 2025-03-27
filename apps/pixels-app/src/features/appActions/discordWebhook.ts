// https://discord.com/developers/docs/reference#snowflakes
export type Snowflake = string; // TODO

type AllowedMentionTypes = "roles" | "users" | "everyone";

enum DiscordComponentType {
  ACTION_ROW = 1,
  BUTTON = 2,
  STRING_SELECT = 3,
  TEXT_INPUT = 4,
  USER_SELECT = 5,
  ROLE_SELECT = 6,
  MENTIONABLE_SELECT = 7,
  CHANNEL_SELECT = 8,
}

interface DiscordComponent {
  type: DiscordComponentType;
}

interface DiscordNonActionRowComponent {
  type: Exclude<DiscordComponentType, DiscordComponentType.ACTION_ROW>;
  custom_id: string; // Max 100 characters, https://discord.com/developers/docs/interactions/message-components#custom-id
}

interface DiscordActionRowComponent extends DiscordComponent {
  type: DiscordComponentType.ACTION_ROW;
  components: DiscordNonActionRowComponent[];
}

export interface DiscordAttachment {
  id: Snowflake;
  filename: string;
  description?: string;
  content_type?: string;
  size: number; // int
  url: string;
  proxy_url: string;
  height?: number; // int
  width?: number; // int
  ephemeral?: boolean;
  duration_secs?: number; // float
  waveform?: string; // base64 encoded bytearray
  flags?: number; // int, see https://discord.com/developers/docs/resources/channel#attachment-object-attachment-flags
}

// According to https://discord.com/developers/docs/resources/webhook#execute-webhook-jsonform-params
export interface BaseDiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  tts?: boolean;
  allowed_mentions?: {
    parse: AllowedMentionTypes[];
    roles: Snowflake[];
    users: Snowflake[];
    replied_user?: boolean; // Default: false
  };
  components?: DiscordActionRowComponent[];
  // There is also a payload_json parameter, but that's only needed for multipart/form-data. We're not using that here.
  attachments?: DiscordAttachment[];
  flags?: number;
  thread_name?: string;
  applied_tags?: unknown[]; // TODO
}

// https://discord.com/developers/docs/resources/channel#embed-object
export interface DiscordWebhookEmbed {
  title?: string; // Max 256 characters
  type: "rich"; // The type is always "rich" for webhook embeds
  description?: string; // Max 4096 characters
  url?: string;
  timestamp?: string; // ISO 8601 timestamp
  color?: number; // int
  footer?: {
    text: string; // Max 2048 characters
    icon_url?: string;
    proxy_icon_url?: string;
  };
  image?: {
    url: string;
    proxy_url?: string;
    height?: number; // int
    width?: number; // int
  };
  thumbnail?: {
    url: string;
    proxy_url?: string;
    height?: number; // int
    width?: number; // int
  };
  video?: {
    url?: string;
    proxy_url?: string;
    height?: number; // int
    width?: number; // int
  };
  provider?: {
    name?: string;
    url?: string;
  };
  author?: {
    name: string; // Max 256 characters
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  fields?: {
    // Up to 25 field objects allowed
    name: string; // Max 256 characters
    value: string; // Max 1024 characters
    inline?: boolean;
  }[];
}

export interface EmbedsDiscordWebhookPayload extends BaseDiscordWebhookPayload {
  embeds: DiscordWebhookEmbed[]; // Up to 10 embedded objects allowed
}
