// According to https://discord.com/developers/docs/resources/webhook#execute-webhook-jsonform-params
interface BaseDiscordWebhookPayload {
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
interface DiscordWebhookEmbed {
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

interface EmbedsDiscordWebhookPayload extends BaseDiscordWebhookPayload {
  embeds: DiscordWebhookEmbed[]; // Up to 10 embedded objects allowed
}
