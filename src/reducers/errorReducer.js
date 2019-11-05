import initialState from "./initialState";
import {
    SET_GLOBAL_ERROR
} from "../actions/actionTypes";

export default function error(state = initialState.error, action) {
    switch (action.type) {
        case SET_GLOBAL_ERROR: {
            return {
                ...state,
                ...action,
                visible: true
            }
        }
        default: 
            return state;
    }    
}
