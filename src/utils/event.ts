import mixpanel from 'mixpanel-browser';

const event = (eventName, params) => {
  if (typeof window !== 'undefined') {
    console.log(`Event: ${eventName}`, params);
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === "production") {
    mixpanel.init('8bc32414aaddeb0ce996c598d8875e4c', { debug: true });
    mixpanel.track(eventName, params);
  }
};

export default event;
