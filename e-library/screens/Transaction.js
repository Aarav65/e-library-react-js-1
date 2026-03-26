import React, {Component} from "react";
import {View, Text, StyleSheet, TouchableOpacity, ToastAndroid, Alert, KeyboardAvoidingView} from "react-native"

import {BarCodeScanner} from "expo-barcode-scanner"
import db from "../config"
import firebase from "firebase"

export default class TransactionScreen extends Component{
  constructor(props){
    super(props);
    this.state = {
      bookId : "",
      studentId : "",
      bookname : "",
      studentName :"",
      domState : "normal",
      hasCameraPermissions : null,
      scanned : false,
      scannedData : ""
    };
  };

  getCameraPermission = async domState => {
    const {status} = await BarCodeScanner.requestPermissionsAsync();

    this.setState({
      hasCameraPermissions : status === "granted",
      domState : domState,
      scanned : false
    });
  };

  handleBarCodeScanned = async({type, data}) => {
    this.setState({
      scannedData : data,
      domState : "normal",
      scanned : true
    });
  };

  handleTransaction = async() => {
    var {bookId, studentId} = this.state;
    await this.getBookDetails(bookId);
    await this.getStudentDetails(studentId);

    var transactionType = await this.checkBookAvailability(bookId);

    if(!transactionType){
      this.setState({bookId : "", studentId : ""});

      Alert.alert("This book doesn't exit in the library database!")
    }else if(transactionType === "issue"){
      var isEligible = await this.checkStudentEligibilityForBookIssue(studentId);

      if(isEligible){
        var {bookName, studentName} = this.state;
        this.initiateBookIssue(bookName, bookId, studentName, studentId);
      }
      Alert.alert("Book issued to the student!");
    }else{
      var isEligible = await this.checkStudentEligibilityForBookReturn(bookId, studentId);

      if(isEligible){
        var {bookName, studentName} = this.state;
        this.initiateBookReturn(bookName, bookId, studentName, studentId)
      }
      Alert.alert("Book returned to the library!");
    }
  };

  getBookDetails = bookId => {
    bookId = bookId.trim();
    db.collection("books")
      .where("book_id","==", bookId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState = ({
            bookName : doc.data().book_details.book_name
          });
        });
      });
  };

  getStudentDetails = studentId => {
    studentId = studentId.trim();
    db.collection("students")
      .where("student_id","==", studentId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState = ({
            bookName : doc.data().student_details.student_name
          });
        });
      });
  };

  checkBookAvailability = async bookId => {
    const bookRef = await db
       .collection("books")
       .where("book_id","==",bookId)
       .get();

    var transactionType = ""
    if(bookRef.docs.length == 0){
      transactionType = false;
    }else{
      bookRef.docs.map(doc => {
        transactionType = doc.data().is_book_available ? "issue" : "return"
      });
    }

    return transactionType;
  };

  checkStudentEligibilityForBookIssue = async studentId => {
    const studentRef = await db
       .collection("students")
       .where("student_id","==",studentId)
       .get();

    isStudentEligible = "";
    if(studentRef.docs.length == 0){
      this.setState({studentId : "", bookId : ""});
      isStudentEligible = false;
      Alert.alert("The student ID doesn't exist in the database");
    }else{
      studentRef.docs.map(doc => {
        if(doc.data().number_of_books_issued < 2){
          isStudentEligible = true;
        }else{
          isStudentEligible = false;
          this.setState({bookId:"", studentId:""});
          Alert.alert("The student has already issued 2 books");
        }
      });
    }

    return isStudentEligible;
  };

  checkStudentEligibilityForBookReturn = async (bookId, studentId) => {
    const transactionRef = await db
       .collection("transactions")
       .where("book_id","==", bookId)
       .limit(1)
       .get()

    var isStudentEligible = "";
    transactionRef.docs.map(doc => {
      var lastBookTransaction = doc.data();
      if(lastBookTransaction.student_id === studentId){
        isStudentEligible = true;
      }else{
        isStudentEligible = false;
        this.setState({bookId:"", studentId:""});
        Alert.alert("The books was not issued by this student");
      }
    });
    return isStudentEligible;
  }

  initiateBookIssue = async(bookName, bookId, studentName, studentId) => {
    db.collection("transactions").add({
      student_id : studentId,
      book_id : bookId,
      student_name : studentName,
      book_id : bookId,
      data : firebase.firestore.Timestamp.now().toDate(),
      transaction_type : "issue"
  });

  db.collection("books")
    .doc(bookId)
    .update({
      is_book_available : false
    });

  db.collection("students")
    .doc(studentId)
    .update({
      number_of_books_issued : firebase.firestore.FieldValue.increment(1)
    });

  this.setState = ({
    bookId : "",
    studentId : ""
  })
  };

  initiateBookReturn = async(bookName, bookId, studentName, studentId) => {
    db.collection("transactions").add({
      student_id : studentId,
      book_id : bookId,
      student_name : studentName,
      book_id : bookId,
      data : firebase.firestore.Timestamp.now().toDate(),
      transaction_type : "return"
  });

  db.collection("books")
    .doc(bookId)
    .update({
      is_book_available : true
    });

  db.collection("students")
    .doc(studentId)
    .update({
      number_of_books_issued : firebase.firestore.FieldValue.increment(-1)
    });

  this.setState = ({
    bookId : "",
    studentId : ""
  })
  };


  render() {
    const {domState, scanned, hasCameraPermissions, scannedData} = this.state;
    if(domState === "scanner"){
      return(
        <BarCodeScanner onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScanned} style = {StyleSheet.absoluteFillObject}></BarCodeScanner>
      );
    }
    
    return(

      <KeyboardAvoidingView behavior="padding" style = {styles.container}>
        <ImageBackground source={bgImage} style = {styles.bgImage}>
          <View style = {styles.upperContainer}>
            <Image source={appIcon} style = {styles.appIcon}></Image>
            <Image source={appName} style = {styles.appName}></Image>
          </View>
          <View style = {styles.lowerContainer}>
            <View style = {styles.textInputContainer}>
              <TextInput
              style = {styles.textInput}
              placeholder={"bookId"}
              placeholderTextColor = {"white"}
              value = {bookId}></TextInput>
              <TouchableOpacity style = {styles.scanButton}
              onPress={() => this.getCameraPermission("bookId")}>
                <Text style = {styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>
            <View style = {[styles.textInputContainer, {marginTop : 25}]}>
              <TextInput
              style = {styles.textInput}
              placeholder={"studentId"}
              placeholderTextColor = {"white"}
              value = {studentId}></TextInput>
              <TouchableOpacity style = {styles.scanButton}
              onPress={() => this.getCameraPermission("studentId")}>
                <Text style = {styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
            style = {[styles.button, {marginTop:25}]}
            onPress={ this.handleTransaction }>
              <Text style = {styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    flex :1,
    backgroundColor : 'blue'
  },
  text : {
    color: 'red',
    fontSize : 30
  },
  button :{
    width : "43%",
    height : 55,
    justifyContent : "center",
    alignItems: "center",
    backgroundColor: "orange",
    borderRadius : 15
  },
  buttonText:{
    fontSize : 24,
    color : "white"
  },
  bgImage: {
    flex : 1,
    resizeMode : "cover",
    justifyContent : "cneter"
  },
  upperContainer:{
    flex : 0.5,
    justifyContent:"center",
    alignItems:"center",
  },
  appIcon:{
    width:200,
    height:200,
    resizeMode:"contain",
    marginTop:25
  },
  appName:{
    width:80,
    height:80,
    resizeMode:"contain"
  },
  lowerContainer:{
    flex:0.5,
    alignItems:"center"
  },
  textInputContainer:{
    borderWidth:2,
    borderRadius:10,
    flexDirection:"row",
    backgroundColor:"green",
    borderColor:"white"
  },
  textInput:{
    width:"57%",
    height:50,
    padding:10,
    borderColor:"white",
    borderRadius:10
  },
  scanButton:{
    width:100,
    height:50,
    backgroundColor:"teal",
    borderTopRightRadius:10,
    borderBlockRadius:10,
    justifyContent:"center",
    alignItems:"center"
  },
  scanButtonText:{
    fontSize:24,
    color:"black",
    fontFamily:"Rajdhani_600SemiBold"
  },
  button:{
    width: "43%",
    height : 55,
    justifyContent : "center",
    alignItems : "center",
    backgroundColor : "orange",
    borderRadius : 15
  },
  buttonText:{
    fontSize : 24,
    color : "white",
    fontFamily:"Rajdhani_600SemiBold"
  }
});