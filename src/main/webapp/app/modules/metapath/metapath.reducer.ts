import axios from 'axios';
import { REQUEST, SUCCESS, FAILURE } from 'app/shared/reducers/action-type.util';

const apiUrl = 'api/metapath';

export const ACTION_TYPES = {
  GET_PREDEFINED_METAPATHS: 'metapath/GET_PREDEFINED_METAPATHS',
  GET_METAPATH_DESCRIPTION: 'metapath/GET_METAPATH_DESCRIPTION'
};

const initialState = {
  loading: false as any,
  error: null as string,
  success: false as boolean,
  predefinedMetapaths: null as any,
  metapathInfo: null as any
};

export type MetapathState = Readonly<typeof initialState>;

// Reducer
export default (state: MetapathState = initialState, action): MetapathState => {
  switch (action.type) {
    case REQUEST(ACTION_TYPES.GET_METAPATH_DESCRIPTION):
      return {
        ...state,
        loading: ACTION_TYPES.GET_METAPATH_DESCRIPTION,
        success: false,
        error: null
      };
    case REQUEST(ACTION_TYPES.GET_PREDEFINED_METAPATHS):
      return {
        ...state,
        loading: ACTION_TYPES.GET_PREDEFINED_METAPATHS,
        success: false,
        error: null
      };
    case FAILURE(ACTION_TYPES.GET_METAPATH_DESCRIPTION): {
      const errorMsg = 'An unexpected error occurred while attempting to retrieve metapath description';
      return {
        ...state,
        loading: false,
        success: false,
        error: errorMsg
      };
    }
    case FAILURE(ACTION_TYPES.GET_PREDEFINED_METAPATHS): {
      const errorMsg = 'An unexpected error occurred while attempting to retrieve predefined metapaths';
      return {
        ...state,
        loading: false,
        success: false,
        error: errorMsg
      };
    }
    case SUCCESS(ACTION_TYPES.GET_PREDEFINED_METAPATHS): {
      const response = action.payload.data;
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
        predefinedMetapaths: response.predefinedMetapaths
      };
    }
    case SUCCESS(ACTION_TYPES.GET_METAPATH_DESCRIPTION): {
      const response = action.payload.data;
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
        metapathInfo: response
      };
    }
    default:
      return state;
  }
};

// Actions
export const getPredefinedMetapaths = dataset => ({
  type: ACTION_TYPES.GET_PREDEFINED_METAPATHS,
  payload: axios.get(`${apiUrl}/predefined`, { params: { dataset } })
});

export const getMetapathDescription = (dataset, entities) => ({
  type: ACTION_TYPES.GET_METAPATH_DESCRIPTION,
  payload: axios.get(`${apiUrl}/description`, {
    params: { dataset, entities: entities.join(',') }
  })
});
