"use client";

import type { 
  DirectionsResponseData, 
  FindPlaceFromTextResponseData, 
} from "@googlemaps/google-maps-services-js";
import { FormEvent, useRef, useState } from "react";
import { useMap } from "../hooks/useMap";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { Alert, Button, Card, CardActions, CardContent, List, ListItem, ListItemText, Snackbar, TextField, Typography } from "@mui/material";

export function NewRoutePage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useMap(mapContainerRef);
  const [directionsData, setDirectionsData] = useState<
    DirectionsResponseData & { request: any }
  >();
  const [open, setOpen] = useState(false);

  async function searchPlaces(event: FormEvent) {
      event.preventDefault();
      const source = (document.getElementById("source") as HTMLInputElement)
        .value;
      const destination = (document.getElementById("destination") as HTMLInputElement)
        .value;
      
      const [sourceResponse, destinationResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_NEXT_API_URL}/places?text=${source}`),    
        fetch(`${process.env.NEXT_PUBLIC_NEXT_API_URL}/places?text=${destination}`),
      ]);

      const [sourcePlace, destinationPlace]: FindPlaceFromTextResponseData[] = 
        await Promise.all([sourceResponse.json(), destinationResponse.json()]);

      if (sourcePlace.status !== "OK") {
          console.error(sourcePlace);
          alert("It was not possible to find the origin");
          return;
      }

      if (destinationPlace.status !== "OK") {
          console.error(destinationPlace);
          alert("It was not possible to find the destination");
          return;
      }

      const placeSourceId = sourcePlace.candidates[0].place_id;
      const placeDestinationId = destinationPlace.candidates[0].place_id;

      const directionsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_NEXT_API_URL}/directions?originId=${placeSourceId}&destinationId=${placeDestinationId}`
    );
      const directionsData: DirectionsResponseData & { request: any } =
        await directionsResponse.json();
      setDirectionsData(directionsData);
      map?.removeAllRoutes();
      await map?.addRouteWithIcons({
        routeId: "1",
        startMarkerOptions: {
          position: directionsData.routes[0].legs[0].start_location,
        },
        endMarkerOptions: {
          position: directionsData.routes[0].legs[0].end_location,
        },
        carMarkerOptions: {
          position: directionsData.routes[0].legs[0].start_location,
        },
    });
  }

  async function createRoute () {
    const startAddress = directionsData!.routes[0].legs[0].start_address;
    const endAddress = directionsData!.routes[0].legs[0].end_address;
    const response = await fetch(`${process.env.NEXT_PUBLIC_NEXT_API_URL}/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': "application/json",
      },
      body: JSON.stringify({
        name:`${startAddress} - $(endAddress)`,
        source_id: directionsData!.request.origin.place_id,
        destination_id: directionsData!.request.destination.place_id,
      }),
    });
    const route = await response.json();
    setOpen(true);
  }

  return (
    <Grid2 container sx={{ display: "flex", flex: 1 }}>
      <Grid2 xs={4} px={2}>
        <Typography variant="h4">New Route</Typography>
        <form onSubmit={searchPlaces}>
          <TextField id="source" label="Origin" fullWidth />
          <TextField 
            id="destination"
            label="Destination"
            fullWidth
            sx={{ mt: 1 }}
          />
          <Button variant="contained" type="submit" sx={{ mt: 1 }} fullWidth>
            Research
          </Button>
        </form>
        {directionsData && (
          <Card sx={{ mt: 1 }}>
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary={"Origin"}
                    secondary={
                      directionsData?.routes[0]!.legs[0]!.start_address
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Destination"}
                    secondary={
                      directionsData?.routes[0]!.legs[0]!.end_address
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Distance"}
                    secondary={
                      directionsData?.routes[0]!.legs[0]!.distance.text
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Duration"}
                    secondary={
                      directionsData?.routes[0]!.legs[0]!.duration.text
                    }
                  />
                </ListItem>
              </List>          
            </CardContent>
          <CardActions sx={{ display: "flex", justifyContent: "center" }}>
             <Button type="button" variant="contained" onClick={createRoute}>
              Add route
             </Button>
          </CardActions>
        </Card>
        )}
      </Grid2>
      <Grid2 id="map" xs={8} ref={mapContainerRef}></Grid2>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}

      > 
        <Alert onClose={() => setOpen(false)} severity="success">
         Route successfully registered
        </Alert>
      </Snackbar>
    </Grid2>
  );
}

export default NewRoutePage;
