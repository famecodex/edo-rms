import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Use test database if in test environment
    const dbUri = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_URI_TEST 
      : process.env.MONGODB_URI;

    if (!dbUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }

    const conn = await mongoose.connect(dbUri, options);

    // Log connection success
    console.log(
      `MongoDB Connected: ${conn.connection.host} (${process.env.NODE_ENV} mode)`
    );

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
