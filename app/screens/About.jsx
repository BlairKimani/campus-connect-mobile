import {View, Text, StyleSheet} from "react-native";
import { Link } from "expo-router";


const About = () => {
    return (
    <View style={styles.container}>
        <Text>
            <Link href='/'>About</Link>
        </Text>
    </View>)
}

export default About

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})