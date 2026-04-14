import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { USER_ROLES } from '../constants/domain.js';
import { normalizeEmail, safeTrim } from '../utils/normalizers.js';
import { generateToken } from '../utils/generateToken.js';

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    certificateNumber: user.certificateNumber,
    station: user.station,
  };
}

function isStrongPassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function resolveSignupRole(requestedRole, isFirstUser) {
  if (isFirstUser) {
    return 'Admin';
  }

  if (process.env.ALLOW_OPEN_ROLE_SIGNUP === 'true' && USER_ROLES.includes(requestedRole)) {
    return requestedRole;
  }

  return 'Engineer';
}

export async function signup(req, res, next) {
  try {
    const { name, email, password, role, certificateNumber, station } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Name, email, and password are required.');
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      res.status(400);
      throw new Error('A valid email address is required.');
    }

    if (!isStrongPassword(password)) {
      res.status(400);
      throw new Error('Password must be at least 8 characters and include both letters and numbers.');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400);
      throw new Error('An account with that email already exists.');
    }

    const existingUsersCount = await User.countDocuments();
    const resolvedRole = resolveSignupRole(role, existingUsersCount === 0);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: safeTrim(name),
      email: normalizedEmail,
      password: hashedPassword,
      role: resolvedRole,
      certificateNumber: safeTrim(certificateNumber),
      station: safeTrim(station, 'Main Base') || 'Main Base',
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required.');
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      res.status(401);
      throw new Error('Invalid email or password.');
    }

    res.json({
      token: generateToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res) {
  res.json(serializeUser(req.user));
}
