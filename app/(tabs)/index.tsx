// index.tsx or HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { database } from '../../firebase';
import { ref, onValue } from '@react-native-firebase/database';
import { CircularProgress } from 'react-native-circular-progress';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humanPresence, setHumanPresence] = useState<boolean | null>(null);
  const [soilMoisture, setSoilMoisture] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const tempRef = ref(database, 'sensor/temperature');
    const presenceRef = ref(database, 'sensor/humanPresence');
    const soilRef = ref(database, 'sensor/soil_moisture'); // Updated to match database field
    const humidityRef = ref(database, 'sensor/humidity');

    const unsubscribeTemp = onValue(tempRef, (snapshot) => {
      if (snapshot.exists()) {
        const { value, timestamp } = snapshot.val();
        setTemperature(value);
        setLastUpdate(new Date(timestamp).toLocaleString());
        setTempHistory((prev) => [...prev.slice(-5), value].slice(-5)); // Keep last 5 values
      }
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const { status, timestamp } = snapshot.val();
        setHumanPresence(status);
        setLastUpdate(new Date(timestamp).toLocaleString());
      }
    }, (err) => {
      setError(err.message);
    });

    const unsubscribeSoil = onValue(soilRef, (snapshot) => {
      if (snapshot.exists()) {
        const { value } = snapshot.val();
        setSoilMoisture(value);
      }
    }, (err) => {
      setError(err.message);
    });

    const unsubscribeHumidity = onValue(humidityRef, (snapshot) => {
      if (snapshot.exists()) {
        const { value } = snapshot.val();
        setHumidity(value);
      }
    }, (err) => {
      setError(err.message);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeTemp();
      unsubscribePresence();
      unsubscribeSoil();
      unsubscribeHumidity();
    };
  }, []);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => {
          setLoading(true);
          setError(null);
        }}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={() => {
          setLoading(true);
          setError(null);
        }}>
          <Ionicons name="refresh-circle" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.timestamp}>Last update: {lastUpdate}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weather</Text>
        <View style={styles.weatherBody}>
          <Ionicons name="sunny" size={64} color="#FFC700" />
          <View>
            <Text style={styles.weatherTemp}>23°C</Text>
            <Text style={styles.weatherDesc}>Probability rain: 15%</Text>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Temperature</Text>
          <View style={styles.gaugeContainer}>
            <CircularProgress
              size={120}
              width={12}
              fill={temperature ? (temperature / 50) * 100 : 0}
              tintColor="#00e0ff"
              backgroundColor="#3d5875">
              {
                (fill) => (
                  <Text style={styles.gaugeText}>
                    {temperature}°C
                  </Text>
                )
              }
            </CircularProgress>
          </View>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Presence</Text>
          <View style={styles.gaugeContainer}>
            <CircularProgress
              size={120}
              width={12}
              fill={humanPresence ? 100 : 0}
              tintColor="#FFC700"
              backgroundColor="#3d5875">
              {
                (fill) => (
                  <Ionicons name={humanPresence ? "person" : "walk"} size={40} color="#FFC700" />
                )
              }
            </CircularProgress>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Soil Moisture</Text>
          <View style={styles.gaugeContainer}>
            <CircularProgress
              size={120}
              width={12}
              fill={soilMoisture || 0}
              tintColor="#795548"
              backgroundColor="#D7CCC8">
              {
                (fill) => (
                  <Text style={styles.gaugeText}>
                    {soilMoisture}%
                  </Text>
                )
              }
            </CircularProgress>
          </View>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Humidity</Text>
          <View style={styles.gaugeContainer}>
            <CircularProgress
              size={120}
              width={12}
              fill={humidity || 0}
              tintColor="#2196F3"
              backgroundColor="#BBDEFB">
              {
                (fill) => (
                  <Text style={styles.gaugeText}>
                    {humidity}%
                  </Text>
                )
              }
            </CircularProgress>
          </View>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consumption</Text>
        <BarChart
          data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{ data: [20, 45, 28, 80, 99] }]
          }}
          width={Dimensions.get('window').width - 64}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={30}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Temperature History</Text>
        <LineChart
          data={{
            labels: ["-4m", "-3m", "-2m", "-1m", "Now"],
            datasets: [{ data: tempHistory.length > 1 ? tempHistory : [0, 0, 0, 0, 0] }]
          }}
          width={Dimensions.get('window').width - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#F0F4F7',
  },
  container: {
    padding: 16,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F7',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 32
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333'
  },
  timestamp: {
    width: '100%',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  halfCard: {
    width: '48%',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  gaugeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  weatherBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333'
  },
  weatherDesc: {
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;