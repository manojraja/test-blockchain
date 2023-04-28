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
	Circle_Rate_File_Hash string `json:"Circle_Rate_File_Hash"`
	Circle_Rate_Value_Hash string `json:"Circle_Rate_Value_Hash"`
	//payload
	AreaName string `json:"AreaName"`
	CityName string `json:"CityName"`
	CreatedBy            string `json:"CreatedBy"`
	UpdatedBy            string `json:"UpdatedBy"`
	LastUpdatedTimestamp string `json:"LastUpdatedTimestamp"`
    BlockchainID string `json:"BlockchainID"`
}


var logger = flogging.MustGetLogger("fabcar_cc")

// Init ;  Method for initializing smart contract
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	var circleRateData = CircleRateData{
		Circle_Rate_File_Hash: "fdfdsd", Circle_Rate_Value_Hash: "SA123", BlockchainID: "Block21", AreaName: "Tomoko", CityName: "dfdfdf",  CreatedBy: "manoj", UpdatedBy: "manoj", LastUpdatedTimestamp: "d232323",
	}
	CircleRateDataJSON, err := json.Marshal(circleRateData)
	if err != nil {
		return shim.Error(err.Error())
	}

	 APIstub.PutState(circleRateData.BlockchainID, CircleRateDataJSON)
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
		Circle_Rate_File_Hash: args[0],
		Circle_Rate_Value_Hash: args[1],
		 BlockchainID: args[2], 
		 AreaName: args[3],
		 CityName: args[4],  
		 CreatedBy: args[5], 
		 UpdatedBy: args[6], 
		 LastUpdatedTimestamp: args[7],
	}
	circleRateDataJSON, err := json.Marshal(circleRateData)
	if err != nil {
		return shim.Error(err.Error())
	}

	 APIstub.PutState(circleRateData.BlockchainID, circleRateDataJSON)
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
