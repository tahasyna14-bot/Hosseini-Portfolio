import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContact } from '../src/middleware/validation.js';

test('accepts a valid contact message and normalizes fields', () => {
  const result = validateContact({
    name: '  Test   User ',
    email: 'TEST@example.com',
    message: 'This is a valid test message.'
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.name, 'Test User');
  assert.equal(result.data.email, 'test@example.com');
});

test('rejects an invalid email', () => {
  const result = validateContact({ name: 'Test', email: 'bad-email', message: 'This is a valid test message.' });
  assert.equal(result.ok, false);
});

test('rejects a short message', () => {
  const result = validateContact({ name: 'Test', email: 'test@example.com', message: 'short' });
  assert.equal(result.ok, false);
});

test('rejects a filled honeypot field', () => {
  const result = validateContact({ name: 'Test', email: 'test@example.com', message: 'This is a valid test message.', website: 'bot' });
  assert.equal(result.ok, false);
});
