import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Map = () => {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        // Charger les données des lieux depuis le fichier JSON
        fetch('/locations.json')
            .then((response) => response.json())
            .then((data) => setLocations(data))
            .catch((error) => console.error("Erreur lors du chargement des données :", error));

        // Initialisation de la carte
        const map = L.map('map', {
            crs: L.CRS.Simple, // Pour utiliser une image comme base
            minZoom: -2,       // Permet un zoom éloigné
        }).setView([500, 500], 0); // Centre de la carte

        // Ajouter l'image de la carte comme fond
        const bounds = [[0, 0], [1000, 1000]]; // Dimensions de la carte
        L.imageOverlay('/map.png', bounds).addTo(map);
        map.fitBounds(bounds);

        return () => {
            map.remove(); // Nettoyer la carte à la destruction du composant
        };
    }, []);

    useEffect(() => {
        // Ajouter les marqueurs une fois que les lieux sont chargés
        if (locations.length > 0) {
            const map = L.map('map'); // Récupérer la carte existante
            locations.forEach((location) => {
                L.marker([location.x, location.y])
                    .addTo(map)
                    .bindPopup(`<b>${location.name}</b><br>Époque : ${location.epoch}`);
            });
        }
    }, [locations]);

    return <div id="map" style={{ height: "100vh", width: "100%" }}></div>;
};

export default Map;
