const id = "EVENT_PALETTE_SET_BACKGROUND";

const fields = [
  {
    key: "palette0",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 0
  },
  {
    key: "palette1",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 1 
  },
  {
    key: "palette2",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 2  
  },
  {
    key: "palette3",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 3    
  },
  {
    key: "palette4",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 4      
  },
  {
    key: "palette5",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 5       
  },
];

const compile = (input, helpers) => {
  const { paletteSetBackground, event } = helpers;
  paletteSetBackground(event.id);
};

module.exports = {
  id,
  fields,
  compile,
};
