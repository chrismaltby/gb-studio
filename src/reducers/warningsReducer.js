import initialState from "./initialState";
import {
    SET_BACKGROUND_WARNINGS,
    SET_SPRITE_WARNINGS
} from "../actions/actionTypes";

export default function error(state = initialState.warnings, action) {
    switch (action.type) {
        case SET_BACKGROUND_WARNINGS: {
            return {
                ...state,
                backgrounds: {
                    ...state.backgrounds,
                    [action.id]: {
                        id: action.id,
                        warnings: action.warnings,
                        timestamp: Date.now()
                    }
                }
            }
        }
        case SET_SPRITE_WARNINGS: {
            return {
                ...state,
                sprites: {
                    ...state.sprites,
                    [action.id]: {
                        id: action.id,
                        warnings: action.warnings,
                        timestamp: Date.now()
                    }
                }
            }
        }        
        default: 
            return state;
    }    
}
