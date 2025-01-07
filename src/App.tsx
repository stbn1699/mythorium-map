import Map from './Map';
import {Route, BrowserRouter as Router, Routes} from "react-router-dom";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Map mapName="worldMap" maxZoom={3} minEpoch={0} maxEpoch={5000} />} />
            </Routes>
        </Router>
    );
}

export default App;