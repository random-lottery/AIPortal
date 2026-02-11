import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../utils/supabase';
import type { User } from '../models/User';

const authRouter = Router();

// Register new user
authRouter.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body as User;
    if (!username || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const supabase = getSupabaseClient();
    
    // Check if user already exists
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .limit(1);

    if (fetchError) {
      console.error('Error checking existing user:', fetchError);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      res.status(409).json({ message: 'Username or email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        { username, email, password: hashedPassword }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as Pick<User, 'email' | 'password'>;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const supabase = getSupabaseClient();
    
    // Find user by email
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, username, password')
      .eq('email', email)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    if (!users || users.length === 0) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.status(200).json({ token, userId: user.id, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default authRouter;
