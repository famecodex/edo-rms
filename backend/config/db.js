import mongoose from 'mongoose';

// This is the function we will call to connect to our database
const connectDB = async () => {
  try {
    // We try to connect to the database using the URI from our .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If successful, we log a message to the console
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If it fails, we log the error and exit the application
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit with a failure code
  }
};

export default connectDB;
