import React, {useEffect, useState} from 'react';
import L, {Map as LeafletMap} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css'; // Import des styles

// Typage des lieux
interface Location {
    id: number;
    name: string;
    x: number;
    y: number;
    epochStart: number;
    epochEnd: number;
}

let map: LeafletMap | null = null; // Variable pour stocker l'instance de la carte

const Map: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);

    useEffect(() => {
        // Charger les données depuis le fichier JSON
        fetch('/locations.json')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des données');
                }
                return response.json();
            })
            .then((data: Location[]) => setLocations(data))
            .catch((error) => console.error('Erreur :', error));

        // Vérifier si une carte existe déjà
        if (!map) {
            map = L.map('map', {
                crs: L.CRS.Simple,
                minZoom: -2,
            }).setView([500, 500], 0);

            // Ajouter l'image de la carte comme fond
            const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]]; // Dimensions de l'image
            L.imageOverlay('/map.png', bounds).addTo(map);
            map.fitBounds(bounds);
        }

        return () => {
            // Nettoyer l'instance de la carte lors du démontage
            if (map) {
                map.remove();
                map = null;
            }
        };
    }, []);

    useEffect(() => {
        // Ajouter les marqueurs une fois que les lieux sont chargés
        if (locations.length > 0 && map) {
            locations.forEach((location) => {
                L.marker([location.x, location.y])
                    .addTo(map!)
                    .bindPopup(`<b>${location.name}</b><br>Époque : ${location.epochStart} - ${location.epochEnd}`);
            });
        }
    }, [locations]);

    return (
        <div id="map"></div>
    );
};

export default Map;
