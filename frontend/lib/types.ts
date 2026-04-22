export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  location_lat: number;
  location_lng: number;
  location_city: string;
  location_state: string;
  location_country: string;
  role?: string;
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginInput {
  email_or_username: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  display_name?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
}

export interface UpdateUserInput {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
}

export type TankType = 'freshwater' | 'saltwater' | 'planted' | 'reef' | 'brackish';

export interface Tank {
  id: string;
  user_id: string;
  name: string;
  volume_liters: number;
  dimensions_length: number;
  dimensions_width: number;
  dimensions_height: number;
  tank_type: TankType;
  cover_photo_url: string;
  description: string;
  created_at: string;
  updated_at: string;
  photos?: TankPhoto[];
  livestock?: Livestock[];
  user?: User;
}

export interface TankPhoto {
  id: string;
  tank_id: string;
  url: string;
  caption: string;
  is_primary: boolean;
  order: number;
  created_at: string;
}

export interface Livestock {
  id: string;
  tank_id: string;
  common_name: string;
  scientific_name: string;
  quantity: number;
  type: 'fish' | 'plant' | 'invertebrate';
  active: boolean;
  created_at: string;
}

export interface CreateTankInput {
  name: string;
  volume_liters: number;
  dimensions_length?: number;
  dimensions_width?: number;
  dimensions_height?: number;
  tank_type: TankType;
  description?: string;
}

export interface UpdateTankInput {
  name?: string;
  volume_liters?: number;
  tank_type?: TankType;
  cover_photo_url?: string;
  description?: string;
}

export interface Comment {
  id: string;
  user_id: string;
  commentable_type: string;
  commentable_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface CreateCommentInput {
  commentable_type: string;
  commentable_id: string;
  content: string;
}

export interface Like {
  id: string;
  user_id: string;
  likeable_type: string;
  likeable_id: string;
  created_at: string;
  user?: User;
}

export interface LikeStats {
  like_count: number;
  is_liked: boolean;
}

export type ProjectType = 'breeding' | 'aquascaping' | 'disease_treatment' | 'equipment_diy' | 'species_care' | 'biotope';
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'abandoned';

export interface Project {
  id: string;
  user_id: string;
  tank_id?: string;
  title: string;
  description: string;
  project_type: ProjectType;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  cover_photo_url: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  tank?: Tank;
  updates?: ProjectUpdate[];
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  media?: ProjectUpdateMedia[];
}

export interface ProjectUpdateMedia {
  id: string;
  project_update_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string;
  display_order: number;
  created_at: string;
}

export interface CreateProjectInput {
  tank_id?: string;
  title: string;
  description: string;
  project_type: ProjectType;
  status?: ProjectStatus;
  start_date?: string;
  is_public?: boolean;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  cover_photo_url?: string;
  is_public?: boolean;
}

export interface CreateProjectUpdateInput {
  title: string;
  content: string;
  media?: {
    media_url: string;
    media_type: 'image' | 'video';
    caption?: string;
    display_order?: number;
  }[];
}

// Marketplace types
export type ListingCategory = 'fish' | 'plants' | 'equipment' | 'full_setup' | 'other';
export type ListingCondition = 'new' | 'used' | 'n/a';
export type ListingPriceType = 'fixed' | 'free' | 'negotiable';
export type ListingStatus = 'available' | 'reserved' | 'sold' | 'deleted';

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: ListingCategory;
  condition?: string;
  price?: number;
  price_type: ListingPriceType;
  currency: string;
  location_city: string;
  location_state: string;
  location_country: string;
  location_lat?: number;
  location_lng?: number;
  status: ListingStatus;
  view_count: number;
  favorite_count: number;
  is_featured: boolean;
  featured_until?: string;
  created_at: string;
  updated_at: string;
  bumped_at: string;
  user?: User;
  photos?: ListingPhoto[];
  reviews?: ListingReview[];
  is_favorited?: boolean;
  distance?: number;
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  photo_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ListingReview {
  id: string;
  listing_id: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  reviewer?: User;
}

export interface CreateListingInput {
  title: string;
  description: string;
  category: ListingCategory;
  condition?: string;
  price?: number;
  price_type: ListingPriceType;
  location_city: string;
  location_state: string;
  location_country: string;
  location_lat?: number;
  location_lng?: number;
  photos: string[];
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  category?: ListingCategory;
  condition?: string;
  price?: number;
  price_type?: ListingPriceType;
  status?: ListingStatus;
}

// Messaging types
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
}

export interface Conversation {
  user1_id: string;
  user2_id: string;
  last_message: string;
  last_message_at: string;
  last_sender_id: string;
  is_read: boolean;
  unread_count: number;
  other_user?: User;
}

export interface CreateMessageInput {
  receiver_id: string;
  content: string;
}

export interface WebSocketMessage {
  type: 'message' | 'read_receipt' | 'typing' | 'error';
  payload: any;
}

export interface TypingIndicator {
  user_id: string;
  is_typing: boolean;
  timestamp: string;
}

export interface ReadReceipt {
  message_id: string;
  user_id: string;
  read_at: string;
}

// Notifications
export type NotificationType = 
  | 'comment' 
  | 'like' 
  | 'follow' 
  | 'message' 
  | 'marketplace' 
  | 'project_update';

export type EntityType = 'tank' | 'project' | 'listing' | 'message' | 'comment';

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: NotificationType;
  entity_type?: EntityType;
  entity_id?: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  actor?: User;
}

export interface NotificationPreferences {
  email_comments: boolean;
  email_likes: boolean;
  email_follows: boolean;
  email_messages: boolean;
  email_marketplace: boolean;
  email_project_updates: boolean;
  push_enabled: boolean;
}

export interface ProjectSubscription {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

