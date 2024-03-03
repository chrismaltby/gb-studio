export const clipboard = {
  writeText: jest.fn(),
  writeBuffer: jest.fn(),
};

const electron = {
  app: null,
};

export default electron;
