package main

import (
	// "bytes"
	"encoding/json"
	"fmt"
	// "strconv"
	// "time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	sc "github.com/hyperledger/fabric-protos-go/peer"
	"github.com/hyperledger/fabric/common/flogging"

	// "github.com/hyperledger/fabric-chaincode-go/pkg/cid"
)

// SmartContract Define the Smart Contract structure
type SmartContract struct {
}

// Car :  Define the car structure, with 4 properties.  Structure tags are used by encoding/json library
type CircleRateData struct {
	District string `json:"District"`
	Taluka string `json:"Taluka"`
	//payload
	Village string `json:"Village"`
	Land_Type string `json:"Land_Type"`
	Category string `json:"Category"`
	Extension string `json:"Extension"`
	Value string `json:"Value"`
	CreatedBy            string `json:"CreatedBy"`
	UpdatedBy            string `json:"UpdatedBy"`
	LastUpdatedTimestamp string `json:"LastUpdatedTimestamp"`
    Survey_No string `json:"Survey_No"`
	}


var logger = flogging.MustGetLogger("fabcar_cc")

// Init ;  Method for initializing smart contract
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	var circleRateData = CircleRateData{
		District: "fdfdsd", Taluka: "SA123", Survey_No: "Block21", Village: "Tomoko", Land_Type: "dfdfdf", Category:"category", Extension:"ext1", Value:"200", CreatedBy: "manoj", UpdatedBy: "manoj", LastUpdatedTimestamp: "d232323",
	}
	CircleRateDataJSON, err := json.Marshal(circleRateData)
	if err != nil {
		return shim.Error(err.Error())
	}

	 APIstub.PutState(circleRateData.Survey_No, CircleRateDataJSON)
     return shim.Success(CircleRateDataJSON)
}


func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	function, args := APIstub.GetFunctionAndParameters()
	logger.Infof("Function name is:  %d", function)
	logger.Infof("Args length is : %d", len(args))
//	log.Printf("In init fmt",args)

	switch function {
	case "invokeCircleRateRegistry":
		return s.invokeCircleRateRegistry(APIstub, args)
	case "queryCircleRateRegistry":
		return s.queryCircleRateRegistry(APIstub, args)
	default:
		return shim.Error("Invalid Smart Contract function name.")
	}

	// return shim.Error("Invalid Smart Contract function name.")
}
func (s *SmartContract) invokeCircleRateRegistry(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	var circleRateData = CircleRateData{
		District: args[0],
		Taluka: args[1],
		Survey_No: args[2], 
		Village: args[3],
		Land_Type: args[4],  
		 CreatedBy: args[5], 
		 UpdatedBy: args[6], 
		 LastUpdatedTimestamp: args[7],
		 Value: args[8],
		 Category: args[9],
		 Extension: args[10],
	}
	circleRateDataJSON, err := json.Marshal(circleRateData)
	if err != nil {
		return shim.Error(err.Error())
	}

	 APIstub.PutState(circleRateData.Survey_No, circleRateDataJSON)
	return shim.Success(circleRateDataJSON)

}


func (s *SmartContract) queryCircleRateRegistry(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	carAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(carAsBytes)
}


// Invoke :  Method for INVOKING smart contract



// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
