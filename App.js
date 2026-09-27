import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SQLite from 'expo-sqlite';

// SQLite Database Open
const db = SQLite.openDatabaseSync('earbuds.db');

export default function App() {
  const [locationLogs, setLocationLogs] = useState([]);
  const [region, setRegion] = useState({
    latitude: 26.8467,
    longitude: 80.9462,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    // Table Setup
    db.execSync(`
      CREATE TABLE IF NOT EXISTS location_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_name TEXT,
        latitude REAL,
        longitude REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    fetchLogsFromDB();
  }, []);

  const fetchLogsFromDB = () => {
    const allRows = db.getAllSync('SELECT * FROM location_logs ORDER BY id DESC;');
    setLocationLogs(allRows);
    
    if (allRows.length > 0) {
      setRegion({
        latitude: allRows[0].latitude,
        longitude: allRows[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleSimulatedDisconnect = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required!');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lng = location.coords.longitude;

    db.runSync(
      'INSERT INTO location_logs (device_name, latitude, longitude) VALUES (?, ?, ?);',
      ['Realme Earbuds', lat, lng]
    );

    Alert.alert('Disconnected!', 'Earbud location captured and saved to SQLite.');
    fetchLogsFromDB();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎧 Earbud Tracker</Text>
        <Button title="Simulate Disconnect" onPress={handleSimulatedDisconnect} color="#e63946" />
      </View>

      <MapView style={styles.map} region={region}>
        {locationLogs.map((log) => (
          <Marker
            key={log.id}
            coordinate={{ latitude: log.latitude, longitude: log.longitude }}
            title={log.device_name}
            description={`Disconnected at: ${log.timestamp}`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#1d3557',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height - 100 },
});
