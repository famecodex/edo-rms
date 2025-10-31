import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import schoolRoutes from "./routes/schoolRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";





dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.get('/', (req, res) => res.send('✅ API is running successfully...'));
app.use('/api/users', userRoutes);

app.listen(port, () =>
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${port}`)
);

app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);

app.use('/api/students', studentRoutes);


app.use("/api/schools", schoolRoutes);
app.use("/api/teachers", teacherRoutes);