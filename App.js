import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Picker
} from "react-native";
import * as firebaseApp from "firebase";
import {
  TextInput,
  Snackbar,
  Portal,
  Dialog,
  Paragraph,
  Avatar,
  Button,
  Card,
  Title,
  Provider as PaperProvider
} from "react-native-paper";
import DatePicker from "react-native-datepicker";

import Config from "./firebase.js";

import { Platform } from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default class App extends React.Component {
  constructor(props) {
    super(props);

    if (!firebaseApp.apps.length) {
      firebaseApp.initializeApp(Config);
    }
    this.tasksRef = firebaseApp.database().ref("/aviones");
    console.disableYellowBox = true;

    const dataSource = [];
    this.state = {
      dataSource: dataSource,
      selecteditem: null,
      snackbarVisible: false,
      confirmVisible: false,
      fecha: "",
      dialogVisible: false,
      frecuencias: ["72.010", "72.030", "72.050", "72.070", "72.090", "72.110"],
      choosenIndex: "",
      choosenValue: ""
    };
  }

  componentDidMount() {
    // start listening for firebase updates
    this.listenForTasks(this.tasksRef);
  }

  listenForTasks(tasksRef) {
    tasksRef.on("value", dataSnapshot => {
      var tasks = [];
      dataSnapshot.forEach(child => {
        tasks.push({
          name: child.val().name,
          fecha: child.val().fecha,
          frecuencia: child.val().frecuencia,
          vuela: child.val().vuela,
          key: child.key
        });
      });

      this.setState({
        dataSource: tasks
      });
    });
  }

  renderSeparator = () => {
    return (
      <View
        style={{
          width: "100%",
          height: 2,
          backgroundColor: "#BBB5B3"
        }}
      >
        <View />
      </View>
    );
  };
  showDialog = () => {
    this.setState({ dialogVisible: true });
  };
  handleVuela = () => {
    this.setState({ dialogVisible: false });
    this.updateVuelo();
  };

  handleCancel = () => {
    this.setState({ dialogVisible: false });
  };

  deleteItem(item) {
    this.setState({ deleteItem: item, confirmVisible: true });
  }

  vuelaItem(item) {
    if (item.vuela === true) {
      this.updateVuelo(item);
    } else {
      this.setState({ vuelaItem: item, dialogVisible: true });
    }
  }

  performDeleteItem(key) {
    var updates = {};
    updates["/aviones/" + key] = null;
    return firebaseApp
      .database()
      .ref()
      .update(updates);
  }

  addItem(itemName) {
    var newPostKey = firebaseApp
      .database()
      .ref()
      .child("aviones")
      .push().key;

    var updates = {};
    updates["/aviones/" + newPostKey] = {
      name:
        itemName === "" || itemName == undefined
          ? this.state.itemname
          : itemName,
      fecha: this.state.fecha,
      frecuencia: "",
      vuela: false
    };

    return firebaseApp
      .database()
      .ref()
      .update(updates);
  }

  updateItem() {
    var updates = {};
    updates["/aviones/" + this.state.selecteditem.key] = {
      name: this.state.itemname,
      fecha: this.state.fecha,
      frecuencia: this.state.frecuencia,
      vuela: this.state.vuela
    };

    return firebaseApp
      .database()
      .ref()
      .update(updates);
  }

  updateVuelo(item) {
    if (item) {
      var updates = {};
      updates["/aviones/" + item.key] = {
        name: item.name,
        fecha: item.fecha,
        frecuencia: "",
        vuela: false
      };

      return firebaseApp
        .database()
        .ref()
        .update(updates);
    } else {
      this.tasksRef
        .orderByChild("frecuencia")
        .equalTo(this.state.choosenValue)
        .once("value")
        .then(snapshot => {
          if (snapshot.val()) {
            alert(
              "Ya esta registrada la frecuencia no puedes ingresar a la pista"
            );
          } else {
            var updates = {};
            updates["/aviones/" + this.state.vuelaItem.key] = {
              name: this.state.vuelaItem.name,
              fecha: this.state.vuelaItem.fecha,
              frecuencia: this.state.choosenValue,
              vuela: this.state.vuelaItem.vuela ? false : true
            };

            return firebaseApp
              .database()
              .ref()
              .update(updates);
          }
        });
    }
  }

  saveItem() {
    if (this.state.selecteditem === null) this.addItem();
    else this.updateItem();

    this.setState({ itemname: "", selecteditem: null, fecha: "" });
  }

  hideDialog(yesNo) {
    this.setState({ confirmVisible: false });
    if (yesNo === true) {
      this.performDeleteItem(this.state.deleteItem.key).then(() => {
        this.setState({ snackbarVisible: true });
      });
    }
  }

  showDialog() {
    this.setState({ confirmVisible: true });
    console.log("in show dialog");
  }

  undoDeleteItem() {
    this.addItem(this.state.deleteItem.name);
  }

  render() {
    let frecuencias = this.state.frecuencias.map(v => (
      <Picker.Item label={v} value={v} />
    ));

    return (
      <PaperProvider>
        <View style={styles.container}>
          <ScrollView>
            <View style={{ height: 20 }}></View>

            <Title
              style={{
                alignSelf: "center"
              }}
            >
              Hangar
            </Title>

            <TextInput
              label="Nombre"
              style={{
                height: 50,
                width: 250,
                borderColor: "gray",
                borderWidth: 1,
                alignSelf: "center"
              }}
              onChangeText={text => this.setState({ itemname: text })}
              value={this.state.itemname}
            />
            <View style={{ height: 10 }}></View>

            <DatePicker
              style={{ width: 200, alignSelf: "center" }}
              date={this.state.fecha} //initial date from state
              mode="datetime" //The enum of date, datetime and time
              placeholder="Selecciona la fecha y hora"
              confirmBtnText="Confirm"
              cancelBtnText="Cancel"
              customStyles={{
                dateIcon: {
                  position: "absolute",
                  left: 0,
                  top: 4,
                  marginLeft: 0
                },
                dateInput: {
                  marginLeft: 36
                }
              }}
              onDateChange={date => {
                this.setState({ fecha: date });
              }}
            />
            <View style={{ height: 10 }}></View>

            <View style={{ height: 10 }}></View>
            <Button
              icon={this.state.selecteditem === null ? "Añadir" : "Actualizar"}
              mode="contained"
              onPress={() => this.saveItem()}
            >
              {this.state.selecteditem === null ? "Añadir" : "Actualizar"}
            </Button>
            <FlatList
              data={this.state.dataSource}
              renderItem={({ item }) => (
                <>
                  <View style={{ height: 10 }}></View>

                  <Card>
                    <Card.Content>
                      <Title>{item.name}</Title>
                      <Paragraph>{item.fecha}</Paragraph>
                      <Paragraph>
                        {item.vuela
                          ? "Se encuentra en Pista"
                          : "Actualmente esta en el Hangar"}
                      </Paragraph>
                      <Paragraph>
                        {item.vuela
                          ? `Se encuentra en la ${item.frecuencia}`
                          : ""}
                      </Paragraph>
                    </Card.Content>
                    <Card.Cover
                      source={{ uri: "https://picsum.photos/500/500" }}
                    />
                    <Card.Actions>
                      <Button
                        onPress={() =>
                          this.setState({
                            selecteditem: item,
                            itemname: item.name,
                            fecha: item.fecha,
                            frecuencia: item.frecuencia,
                            vuela: item.vuela
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button onPress={() => this.deleteItem(item)}>
                        Eliminar
                      </Button>

                      <Button
                        onPress={() => {
                          this.vuelaItem(item);
                        }}
                      >
                        {item.vuela ? "Quitar de Pista" : "Poner en pista"}
                      </Button>
                    </Card.Actions>
                  </Card>
                  <View style={{ height: 10 }}></View>
                </>
              )}
              ItemSeparatorComponent={this.renderSeparator}
            />
            <Text />

            <Portal>
              <Dialog
                visible={this.state.dialogVisible}
                onDismiss={this.handleCancel}
              >
                <Dialog.Title>Vas a entrar a la pista de vuelo</Dialog.Title>
                <Dialog.Content>
                  <Text>
                    Necesitas seleccionar la frecuencia con la cual vas a entrar
                  </Text>
                  <Picker
                    selectedValue={
                      this.state.frecuencias[this.state.choosenIndex]
                    }
                    style={{ height: 100, width: 100 }}
                    onValueChange={(itemValue, itemIndex) => {
                      this.setState({
                        choosenIndex: itemIndex,
                        choosenValue: itemValue
                      });
                    }}
                  >
                    {frecuencias}
                  </Picker>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={this.handleCancel}>Cancelar</Button>
                  <Button onPress={this.handleVuela}>Entrar a pista</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>

            <Portal>
              <Dialog
                visible={this.state.confirmVisible}
                onDismiss={() => this.hideDialog(false)}
              >
                <Dialog.Title>¿Estás seguro?</Dialog.Title>
                <Dialog.Content>
                  <Paragraph>¿Estás seguro que quieres eliminar?</Paragraph>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => this.hideDialog(true)}>Si</Button>
                  <Button onPress={() => this.hideDialog(false)}>No</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </ScrollView>
          <Snackbar
            visible={this.state.snackbarVisible}
            onDismiss={() => this.setState({ snackbarVisible: false })}
            action={{
              label: "Deshacer",
              onPress: () => {
                // Do something
                this.undoDeleteItem();
              }
            }}
          >
            Se ha borrado exitosamente
          </Snackbar>
        </View>
      </PaperProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 38 : 22,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 0.5,
    backgroundColor: "#f4f4f4"
  },
  item: {
    padding: 5,
    fontSize: 18,
    height: 54,
    alignItems: "center"
  }
});
