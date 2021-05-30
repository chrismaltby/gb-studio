/* eslint-disable import/prefer-default-export */
export const remote = {
  dialog: {
    // replace the showOpenDialog function with a spy which returns a value
    showOpenDialog: jest.fn().mockReturnValue("path/to/output folder"),
  },
};

export const clipboard = {
  writeText: jest.fn()
};

export default {
  app: null
}
