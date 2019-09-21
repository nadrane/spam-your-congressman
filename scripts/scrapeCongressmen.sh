#!/bin/sh

cd data
touch congressmen.json
curl "https://api.propublica.org/congress/v1/116/house/members.json" -H "X-API-Key: $PROPUBLICA_API_TOKEN" \
  | jq '.results[0] | .members | .[]' \
  > congressmen.json