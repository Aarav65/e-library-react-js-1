import React, {Component} from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native"
import { TextInput } from "react-native-gesture-handler";

export default class SearchScreen extends Component{
  constructor (props){
    super(props);
    this.state = {
      allTransactions : [],
      lastVisibleTransaction : null,
      searchText : ""
    };
  };

  componentDidMount = async() => {
    this.getTransactions();
  };

  getTransactions = () => {
    db.collection("transactions")
      .limit(10)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            allTransactions : [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction : doc
          });
        });
      });
  };
};

handleSearch = async text => {
  var enterdText = text.toUpperCase().split("");
  text = text.toUpperCase();
  this.setState({
    allTransactions : []
  });
  if(!text){
    this.getTransactions();
  }

  if(enterdText[0] === "B"){
    db.collection("transactions")
      .where("book_id","==",text)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            allTransactions : [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction : doc
          });
        });
      });
  }else if(enterdText[0] === "S"){
    db.collection("transactions")
      .where("student_id","==",text)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            allTransactions : [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction : doc
          });
        });
      });
  }
};

fetchMoreTransactions = async text => {
  var enterdText = text.toUpperCase().split("");
  text = text.toUpperCase();

  const {allTransactions, lastVisibleTransaction} = this.state;
  if(enterdText[0] === "B"){
    const query = await db
      .collection("transactions")
      .where("book_id","==",text)
      .startAfter(lastVisibleTransaction)
      .limit(10)
      .get()
  query.docs.map(doc => {
    this.setState({
      allTransactions : [...this.state.allTransactions, doc.data()],
      lastVisibleTransaction : doc
    });
  });
  } else if(enterdText[0] === "S"){
    const query = await db
    .collection("transactions")
    .where("student_id","==",text)
    .startAfter(lastVisibleTransaction)
    .limit(10)
    .get()
   query.docs.map(doc => {
  this.setState({
    allTransactions : [...this.state.allTransactions, doc.data()],
    lastVisibleTransaction : doc
  });
});
  };

  renderItem = ({item, i}) => {
    var date = item.date
      .toDate()
      .toString()
      .split(" ")
      .splice(0, 4)
      .join(" ");
      
      var transactionType = item.transaction_type === "issue" ? "issued" : "returned";

      return(
        <View style={{borderWidth : 1}}>
          <ListItem key={i} bottomDivider>
            <Icon type={"antdesign"} name = {"book"} size = {40}>
              <ListItem.Content>
                <ListItem.Title style = {styles.title}>
                  {`${item.book_name} (${item.book_id})`}
                </ListItem.Title>
                <ListItem.Subtitle style = {styles.subtitle}>
                {`This book ${transactionType} by ${item.student_name}`}
                </ListItem.Subtitle>
                <View style = {styles.lowerLeftContainer}>
                  <View style = {styles.transactionContainer}>
                    <Text 
                    style = {[
                      styles.transactionText,
                      {
                        color : item.transaction_type === "issue" ? "green" : "blue"
                      }
                    ]}>
                      {item.transaction_type.charAt(0).toUpperCase() + item.transaction_type.splice(1)}
                    </Text>
                    <Icon 
                    type = {"ionicon"}
                    name = {item.transaction_type === "issue" ? "checkmark-circle-outline" : "arrow-redo-circle-outline"}
                    color = {item.transaction_type === "issue" ? "green" : "blue"}/>
                  </View>
                  <Text style = {styles.date}>{date}</Text>
                </View>
              </ListItem.Content>
            </Icon>
          </ListItem>
        </View>
      )
  };

  render() {
    const { searchText, allTransactions } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.upperContainer}>
          <View style={styles.textinputContainer}>
            <TextInput
              style={styles.textinput}
              onChangeText={text => this.setState({ searchText: text })}
              placeholder={"Type here"}
              placeholderTextColor={"#FFFFFF"}
            />
            <TouchableOpacity
              style={styles.scanbutton}
              onPress={() => this.handleSearch(searchText)}
            >
              <Text style={styles.scanbuttonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.lowerContainer}>
          <FlatList
            data={allTransactions}
            renderItem={this.renderItem}
            keyExtractor={(item, index) => index.toString()}
            onEndReached={() => this.fetchMoreTransactions(searchText)}
            onEndReachedThreshold={0.7}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    flex :1,
    justifyContent : 'center',
    alignItems : 'center',
    backgroundColor : 'blue'
  },
  upperContainer:{
    flex:0.2,
    justifyContent : "center",
    alignItems : "center"
  },
  textinputContainer:{
    borderWidth:2,
    borderRadius:10,
    flexDirection:"row",
    backgroundColor:"green",
    borderColor : "white"
  },
  textinput:{
    width:"57%",
    height:50,
    padding : 10,
    borderColor : "white",
    borderRadius:10,
    borderWidth:3,
    fontSize:18,
    backgroundColor:"purple",
    fontFamily:"Rajdhani_600SemiBold",
    color : "white"
  },
  scanbutton:{
    width:100,
    height : 50,
    backgroundColor : "green",
    borderTopRightRadius:10,
    borderBottonRightRadius:10,
    justifyContent: "center",
    alignItems:"center"
  }
})