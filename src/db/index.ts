import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Import all schemas
export * from './schemas/users-schema';
export * from './schemas/posts-schema';
export * from './schemas/comments-schema';
export * from './schemas/bookmarks-schema';
export * from './schemas/notifications-schema';

// Import schema tables for database operations
import { 
  users, 
  userSessions, 
  userFollows 
} from './schemas/users-schema';

import { 
  categories, 
  tags, 
  posts, 
  postTags, 
  postViews, 
  postLikes, 
  postRevisions 
} from './schemas/posts-schema';

import { 
  comments, 
  commentLikes, 
  commentFlags, 
  commentRevisions, 
  commentMentions 
} from './schemas/comments-schema';

import { 
  bookmarks, 
  bookmarkCollections, 
  postShares, 
  userActivity, 
  readingHistory, 
  userPreferences, 
  reportedContent 
} from './schemas/bookmarks-schema';

import { 
  notifications, 
  notificationTemplates, 
  notificationSettings, 
  notificationQueue, 
  pushSubscriptions 
} from './schemas/notifications-schema';

// Database configuration
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cyclo_db',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
const pool = mysql.createPool({
  ...connectionConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create Drizzle instance
export const db = drizzle(pool, {
  schema: {
    // User schemas
    users,
    userSessions,
    userFollows,
    
    // Content schemas
    categories,
    tags,
    posts,
    postTags,
    postViews,
    postLikes,
    postRevisions,
    
    // Comment schemas
    comments,
    commentLikes,
    commentFlags,
    commentRevisions,
    commentMentions,
    
    // Interaction schemas
    bookmarks,
    bookmarkCollections,
    postShares,
    userActivity,
    readingHistory,
    userPreferences,
    reportedContent,
    
    // Notification schemas
    notifications,
    notificationTemplates,
    notificationSettings,
    notificationQueue,
    pushSubscriptions,
  },
  mode: 'default',
});

// Export the connection pool for direct queries if needed
export { pool };

// Database connection test function
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown function
export async function closeConnection() {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

// Schema collections for easier access
export const schemas = {
  users: {
    users,
    userSessions,
    userFollows,
  },
  content: {
    categories,
    tags,
    posts,
    postTags,
    postViews,
    postLikes,
    postRevisions,
  },
  comments: {
    comments,
    commentLikes,
    commentFlags,
    commentRevisions,
    commentMentions,
  },
  interactions: {
    bookmarks,
    bookmarkCollections,
    postShares,
    userActivity,
    readingHistory,
    userPreferences,
    reportedContent,
  },
  notifications: {
    notifications,
    notificationTemplates,
    notificationSettings,
    notificationQueue,
    pushSubscriptions,
  },
};

export default db;