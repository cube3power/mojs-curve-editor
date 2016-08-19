import makePoint from '../helpers/make-point';
import C from '../constants';
import initPoints from '../helpers/init-points';
import calculatePath from '../helpers/calculate-path';

const INITIAL_STATE = {
  path:       '',
  segments:   [],
  points:     []
  // points: initPoints([
  //   makePoint({ x: 0,   y: C.CURVE_SIZE, isLockedX: true, type: 'straight' }),
  //   // makePoint({ x: 50,  y: C.CURVE_SIZE/2, type: 'mirrored' }),
  //   makePoint({ x: 100, y: 0, isLockedX: true })
  // ])
}

const deselectAll = (state) => {
  const newState = { ...state, points: [] },
        points   = state.points;

  for (var i = 0; i < points.length; i++) {
    newState.points.push({ ...points[i], isSelected: false });
  }
  return newState;
}

const findSelectedIndecies = (points) => {
  const indecies  = [];

  for (var i = 0; i < points.length; i++) {
    points[i].isSelected && indecies.push( i );
  }
  return indecies;
}

const pointsReducer = (state = INITIAL_STATE, action) => {
  switch( action.type ) {
    case 'POINT_TRANSLATE': {
      const {data}    = action,
            {index}   = data,
            {points}  = state,
            oldPoint  = points[index],
            newPoints = [ ...points ];

      newPoints[ data.index ] = { ...oldPoint, tempX: data.x, tempY: data.y }
      return { points: newPoints, ...calculatePath( newPoints ) };
    }

    case 'POINT_TRANSLATE_END': {
      const index     = action.data,
            {points}  = state,
            oldPoint  = points[index],
            newPoints = [ ...points ];

      newPoints[ index ] = {
          ...oldPoint,
          x: oldPoint.x + oldPoint.tempX,
          y: oldPoint.y + oldPoint.tempY,
          tempX: 0, tempY: 0
        }

      return { points: newPoints, ...calculatePath( newPoints ) };
    }
    
    case 'POINT_SELECT': {
      const {data}              = action,
            {index, isDeselect} = data,
            newState            = (isDeselect) ? deselectAll( state ) : { ...state },
            {points}            = newState;
      
      const point = points[index];
      point.isSelected = true;
      return { ...state, points };
    }

    case 'POINT_ADD': {
      const {data}         = action,
            {index, point} = data,
            deselected     = deselectAll( state );

      const newPoints = [
        ...deselected.points.slice( 0, index ),
        makePoint({ ...point }),
        ...deselected.points.slice( index )
      ];

      const points = (newPoints.length > 1)
                        ? initPoints( newPoints ) : newPoints;

      const path = (points.length > 1)
                      ? calculatePath( points ) : {};

      return { points, ...path };
    }
    
    case 'POINT_DELETE': {
      const {points} = state,
            selected = findSelectedIndecies(points);

      const newPoints = [];
      for (var i = 0; i < points.length; i++) {
        const item = points[i];
        ( selected.indexOf(i) === -1 || item.isLockedX ) && newPoints.push( item );
      }

      return { points: newPoints, ...calculatePath( newPoints ) };
    }

    case 'POINT_CHANGE_TYPE': {
      const {points} = state,
            selected = findSelectedIndecies(points);

      const newPoints = [];
      for (var i = 0; i < points.length; i++) {
        const item = points[i],
              type = action.data;
        // copy all items from previous points
        newPoints.push( { ...item } );
        // if item was selected - set the new `type`
        ( selected.indexOf(i) !== -1 ) && (newPoints[i].type = type);
        
        const index = i,
              point = newPoints[index],
              sibPoint = (index === newPoints.length-1)
                ? newPoints[index-1] : newPoints[index+1];

        const handleIndex = (index === newPoints.length-1) ? 1 : 2,
              sibHandleIndex = (handleIndex === 1) ? 2 : 1,
              handleName = `handle${handleIndex}`,
              sibHandleName = `handle${sibHandleIndex}`,
              handle = { ...point[handleName] },
              sibHandle = { ...point[sibHandleName] };

        point[handleName] = handle;
        point[sibHandleName] = sibHandle;

        if ( type === 'mirrored' || type === 'asymmetric' ) {
          sibHandle.angle = handle.angle - 180;
          if ( type === 'mirrored' ) {
            sibHandle.radius = handle.radius;
          }
        }

      }

      return { points: newPoints, ...calculatePath( newPoints ) };
    }
    
    case 'POINT_DESELECT_ALL': {
      return { ...deselectAll( state ) };
    }

    // HANDLES
    case 'HANDLE_TRANSLATE': {
      const {points}  = state,
            {data}    = action;
      // create new state and copy the new point into it
      const newPoints = [...points],
            newPoint  = { ...newPoints[data.parentIndex] };

      newPoints[data.parentIndex] = newPoint;
      // create handle and copy it into the new point
      const handleName = `handle${data.index}`,
            newHandle = { ...newPoint[handleName] };

      newPoint[ handleName ] = newHandle;
      // finally add angle and radius
      newHandle.angle  = data.angle;
      newHandle.radius = data.radius;

      return { points: newPoints, ...calculatePath( newPoints ) };
    }

    case 'HANDLE_TRANSLATE_END': {
      return state;//{ ...state };
    }

    // case 'POINT_TRANSLATE':
    // case 'POINT_TRANSLATE_END':
    // case 'POINT_ADD':
    // case 'POINT_REMOVDE':
    // case 'POINT_CHANGE_TYPE':
    // case 'HANDLE_TRANSLATE':
    //   return { ...state, ...calculatePath( state.points.present ) }
  }
  return state;
}

export default pointsReducer;