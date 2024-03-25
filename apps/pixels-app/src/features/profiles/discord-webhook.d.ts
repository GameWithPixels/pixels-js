// https://discord.com/developers/docs/reference#snowflakes
export type Snowflake = string; // TODO

type AllowedMentionTypes = "roles" | "users" | "everyone";

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

interface DiscordActionRowComponent extends DiscordComponent {
  type: DiscordComponentType.ACTION_ROW;
  components: DiscordNonActionRowComponent[];
}

interface DiscordNonActionRowComponent {
  type: Exclude<DiscordComponentType, DiscordComponentType.ACTION_ROW>;
  custom_id: string; // Max 100 characters, https://discord.com/developers/docs/interactions/message-components#custom-id
}

interface DiscordButtonComponent extends DiscordNonActionRowComponent {
  type: DiscordComponentType.BUTTON;
  style: DiscordButtonStyle;
  label?: string; // Max 80 characters
  emoji?: Pick<DiscordEmoji, "name" | "id" | "animated">;
  url?: string;
  disabled?: boolean; // Default: false
}

enum DiscordButtonStyle {
  PRIMARY = 1, // blurple
  SECONDARY = 2, // grey
  SUCCESS = 3, // green
  DANGER = 4, // red
  LINK = 5, // grey, navigates to an URL
}

// https://discord.com/developers/docs/resources/emoji#emoji-object
interface DiscordEmoji {
  id?: Snowflake;
  name?: string;
  roles: unknown[]; // TODO
  user: unknown; // TODO
  require_colons?: boolean;
  managed?: boolean;
  animated?: boolean;
  available?: boolean;
}

interface DiscordStringSelectComponent extends DiscordNonActionRowComponent {
  type: DiscordComponentType.STRING_SELECT;
  options: {
    label: string;
    value: string;
    description?: string;
    emoji: Pick<DiscordEmoji, "id" | "name" | "animated">;
    default?: boolean;
  }[];
  placeholder?: string;
  min_values: number; // int
  max_values: number; // int
  disabled?: boolean; // Default: false
}

interface DiscordTextInputComponent extends DiscordNonActionRowComponent {
  type: DiscordComponentType.TEXT_INPUT;
  style: DiscordTextInputStyle;
  label: string; // Max 45 characters
  min_length?: number; // int; min 0, max 4000
  max_length?: number; // int; min 1, max 4000
  required?: boolean; // Default: true
  value?: string; // Max 4000 characters
  placeholder?: string; // Max 100 characters
}

enum DiscordTextInputStyle {
  SHORT = 1,
  PARAGRAPH = 2,
}

interface DiscordAutoPopulatedSelectComponent
  extends DiscordNonActionRowComponent {
  type:
    | DiscordComponentType.USER_SELECT
    | DiscordComponentType.ROLE_SELECT
    | DiscordComponentType.MENTIONABLE_SELECT;
  channel_types: DiscordChannelType[];
  placeholder?: string;
  default_values?: {
    id: Snowflake;
    type: "user" | "role";
  }[];
  min_values: number; // int
  max_values: number; // int
  disabled?: boolean; // Default: false
}

interface DiscordChannelSelectComponent extends DiscordNonActionRowComponent {
  type: DiscordComponentType.CHANNEL_SELECT;
  channel_types: DiscordChannelType[];
  placeholder?: string;
  default_values?: {
    id: Snowflake;
    type: "channel";
  }[];
  min_values: number; // int
  max_values: number; // int
  disabled?: boolean; // Default: false
}

// https://discord.com/developers/docs/resources/channel#channel-object-channel-types
enum DiscordChannelType {
  DUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_ANOUNCEMENT = 5,
  ANNOUNCEMENT_THREAD = 10,
  PUBLIC_THREAD = 11,
  PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_DIRECTORY = 14,
  GUILD_FORUM = 15,
  GUILD_MEDIA = 16,
}

export interface ContentDiscordWebhookPayload
  extends BaseDiscordWebhookPayload {
  content: string;
}

interface EmbedsDiscordWebhookPayload extends BaseDiscordWebhookPayload {
  embeds: DiscordWebhookEmbed[]; // Up to 10 embedded objects allowed
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

interface FileDiscordWebhookPayload extends BaseDiscordWebhookPayload {
  files: unknown; // TODO
}
