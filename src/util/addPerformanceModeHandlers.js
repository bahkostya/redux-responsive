// see: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Testing_media_queries

// external imports
import MediaQuery from 'mediaquery'
// local imports
import calculateResponsiveState from '../actions/creators/calculateResponsiveState'

// this function adds event handlers to the window that only tirgger
// when the responsive state changes
export default ({store, window, calculateInitialState}) => {
    // the function to call when calculating the new responsive state
    function refreshResponsiveState() {
        store.dispatch(calculateResponsiveState(window))
    }

    // grab the current state of the store
    const storeState = store.getState()

    let responsiveStateKey
    // if the redux state root is an Immutable.js Iterable
    if (storeState['@@__IMMUTABLE_ITERABLE__@@'] === true) {
        responsiveStateKey = storeState.findKey(stateBranch => stateBranch._responsiveState)
    } else {
        // go through every reducer at the root of the project
        responsiveStateKey = Object.keys(storeState).reduce((prev, current) => (
            // if the reducer contains the responsive state marker then keep it
            storeState[current] && storeState[current]._responsiveState ? current : prev
        // otherwise the value should be at least falsey
        ), false)
    }

    // if we couldn't find a responsive reducer at the root of the project
    if (!responsiveStateKey) {
        throw new Error(
            'Could not find responsive state reducer - Performance mode can only '
            + 'be used if the responsive reducer is at the root of your reducer tree.'
            + 'If you are still running into trouble, please open a ticket on github.'
        )
    }

    // get the object of breakpoints (handle immutablejs)
    const breakpoints = storeState['@@__IMMUTABLE_ITERABLE__@@'] ? storeState.get(responsiveStateKey).breakpoints : storeState[responsiveStateKey].breakpoints
    // get the object of media queries
    const mediaQueries = MediaQuery.asObject(breakpoints)

    // for every breakpoint range
    Object.keys(mediaQueries).forEach(breakpoint => {
        // create a media query list for the breakpoint
        const mediaQueryList = window.matchMedia(mediaQueries[breakpoint])

        /* eslint-disable no-loop-func */

        // whenever any of the media query lists status changes
        mediaQueryList.addListener((query) => {
            // if a new query was matched
            if (query.matches) {
                // recaulate the state
                refreshResponsiveState()
            }
        })

    })

    // if we are supposed to calculate the initial state
    if (calculateInitialState) {
        // then do so
        refreshResponsiveState()
    }
}