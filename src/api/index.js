import { version } from "../../package.json";
import { Router } from "express";
import facets from "./facets";
import fetch from "node-fetch";

export default ({ config, db }) => {
  let api = Router();

  let CATEGORIES = [];

  fetch(`https://www.eventbriteapi.com/v3/categories`, {
    headers: {
      Authorization: "Bearer PQ7I7XFSHRUMVMLSYZ42"
    }
  })
    .then(res => res.json())
    .then(resp => {
      CATEGORIES = resp.categories;
    });

  // mount the facets resource
  api.use("/facets", facets({ config, db }));

  // perhaps expose some API metadata at the root
  api.get("/", (req, res) => {
    res.json({ version });
  });

  // Heart beat
  api.get("/heartbeat", (req, res) => {
    res.json({ pumping: "yes" });
  });

  // Event Brite API
  api.get("/heartbeat-eb", (req, res) => {
    fetch(
      "https://www.eventbriteapi.com/v3/users/me/?token=PQ7I7XFSHRUMVMLSYZ42"
    )
      .then(res => res.json())
      .then(resp => {
        res.json(resp);
      });

    //-H "Authorization: Bearer PQ7I7XFSHRUMVMLSYZ42"
  });

  // Stub Hub API
  let stubhubToken = "b4689ad4-83f2-3514-bba9-f4e1eda8bd18";
  let stubhubRefreshToken = "dd05c081-6e0d-3ca1-9585-79d0cefdc8c5";

  api.get("/login-sh", (req, res) => {
    fetch(`https://api.stubhub.com/login`, {
      headers: {
        Authorization:
          "Basic eDhHRU5zMWozTUhuZDVOd3NraEZ6RWVxR0VjYTpyeFhFUnR2ZjV4S1hEWWxQWWRqRjZvNUNLMWNh",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST",
      body:
        "grant_type=password&username=apps@whitecloudapps.com&password=fuckawhale420"
    })
      .then(res => res.json())
      .then(resp => {
        console.log(resp);
        res.json(resp);
      });
  });

  // STUBHUB DATA OPERATIONS - DEBUG !

  api.get("/sh-search", (req, res) => {
    // get variables
    var searchQuery = req.query.q;
    var zipCode = req.query.z;

    fetch(
      `https://api.stubhub.com/search/catalog/events/v3?q=${searchQuery}&postalCode=${zipCode}&radius=40mi`,
      {
        headers: {
          Authorization: "Bearer b4689ad4-83f2-3514-bba9-f4e1eda8bd18"
        }
      }
    ).then(resp => {
      console.log(resp);
      res.json(resp);
    });
  });

  // EVENTBRITE DATA OPERATIONS

  api.get("/eb-cat", (req, res, then) => {
    fetch(`https://www.eventbriteapi.com/v3/categories`, {
      headers: {
        Authorization: "Bearer PQ7I7XFSHRUMVMLSYZ42"
      }
    })
      .then(res => res.json())
      .then(resp => {
        CATEGORIES = resp.categories;
        res.json(resp);
      });
  });

  api.get("/console-test", (req, res) => {
    console.log(CATEGORIES);
  });

  // Search Aggregate

  function formatThis(data) {
    const returnVal = {};
    returnVal.uniqueVenues = [];
    const events = data.events;
    // find most popping venues
    events.map(function(event) {
      let val = returnVal.uniqueVenues.find(x => x.name === event.venue.name);
      if (!val) {
        returnVal.uniqueVenues.push({
          id: event.venue.id,
          name: event.venue.name,
          address: event.venue.address.address_1,
          city: event.venue.address.city,
          occurences: 1,
          events: [event]
        });
      } else {
        val.occurences += 1;
        val.events.push(event);
      }
    });
    // sort descending
    returnVal.uniqueVenues.sort(function(a, b) {
      return b.occurences - a.occurences;
    });

    return returnVal;
  }

  api.get("/eb-search", (req, res) => {
    // get variables
    var searchQuery = req.query.q;
    var zipCode = req.query.z;
    var category = req.query.c;
    // category
    // subcategories
    // Search eventbrite
    fetch(
      `https://www.eventbriteapi.com/v3/events/search/?q=${searchQuery}&location.address=${
        zipCode ? zipCode : 94536
      }&location.within=40mi&categories=${
        category ? category : 103
      }&expand=venue,organizer`, //q="${searchQuery}`,
      {
        headers: {
          Authorization: "Bearer PQ7I7XFSHRUMVMLSYZ42"
        }
      }
    )
      .then(res => res.json())
      .then(resp => {
        const formatData = formatThis(resp);
        res.json({ original: resp, formatted: formatData });
      });
  });

  api.get("/major-venues-for", (req, res) => {
    // search for keyword and location
    // unique out the venues
    // call venues and get details
    //
  });

  // Invoke by time

  return api;
};
