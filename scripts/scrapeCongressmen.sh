#!/bin/sh

cd data
touch congress.json
curl "https://api.propublica.org/congress/v1/116/house/members.json" -H "X-API-Key: $PROPUBLICA_API_TOKEN" \
  | jq -c '.results[0] | .members | .[]' \
  > congress.jl