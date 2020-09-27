import { nanoid } from "nanoid";

// Id length set as a trade off in size/collision probability
// Using probability calculator at
// https://zelark.github.io/nano-id-cc/
// this length allows making a project around the size of the
// sample project every hour for ~3 million years before there
// is a 1% chance of a single collision

const ID_LENGTH = 16;

const makeId = () => nanoid(ID_LENGTH)

export default makeId;
