import axios from 'axios';

const deleteAllNotes = async () => {
  try {
    // First, get a token by logging in
    console.log('Logging in to get auth token...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@test.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('Successfully logged in');

    // Now delete all notes with the auth token
    console.log('Attempting to delete all notes...');
    const response = await axios.delete('http://localhost:3001/api/notes/all/confirm', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('All notes deleted successfully');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

deleteAllNotes();
