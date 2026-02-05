const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

const randomChar = () => alphabet[Math.floor(Math.random() * alphabet.length)];

const cuid = () => {
  let id = 'c';
  for (let i = 0; i < 24; i += 1) {
    id += randomChar();
  }
  return id;
};

export default cuid;
