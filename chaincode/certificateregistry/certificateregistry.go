package main

import (
	"bytes"
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
type CertificateData struct {
	IssuerName string `json:"IssuerName"`
	IssuerDate string `json:"IssuerDate"`
	CertificateType string `json:"CertificateType"`
	VerifierEmail string `json:"VerifierEmail"`
	VerifierId string `json:"VerifierId"`
	CertificateId string `json:"CertificateId"`
	FileHash string `json:"FileHash"`
	FilePath string `json:"FilePath"`
	PlaceOfIssuance string `json:"PlaceOfIssuance"`
	CreatedBy            string `json:"CreatedBy"`
	UpdatedBy            string `json:"UpdatedBy"`
	LastUpdatedTimestamp string `json:"LastUpdatedTimestamp"`

	}
type StoreCertificateKey struct {
	VerifierId string `json:"VerifierId"`
	CertificateId string `json:"CertificateId"`
	}


var logger = flogging.MustGetLogger("fabcar_cc")

// Init ;  Method for initializing smart contract
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	var certificateData = CertificateData{
		IssuerName: "fdfdsd",IssuerDate:"2023-05-23 14:17", CertificateType:"Education",VerifierEmail:"test@g.com", VerifierId: "SA123", CertificateId:"cert_1234", FileHash:"bfjheveureyveru",FilePath:"/yvvdfd/jvjhs",  CreatedBy: "manoj", UpdatedBy: "manoj", LastUpdatedTimestamp: "d232323",
	}
	CertificateDataJSON, err := json.Marshal(certificateData)
	if err != nil {
		return shim.Error(err.Error())
	}

	 APIstub.PutState(certificateData.CertificateId, CertificateDataJSON)
     return shim.Success(CertificateDataJSON)
}


func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	function, args := APIstub.GetFunctionAndParameters()
	logger.Infof("Function name is:  %d", function)
	logger.Infof("Args length is : %d", len(args))
//	log.Printf("In init fmt",args)

	switch function {
	case "invokeCertificateData":
		return s.invokeCertificateData(APIstub, args)
	case "storeCertificateKey":
		return s.storeCertificateKey(APIstub, args)
	case "queryCertificateData":
		return s.queryCertificateData(APIstub, args)
	case "queryAllCertificates":
		return s.queryAllCertificates(APIstub)
	default:
		return shim.Error("Invalid Smart Contract function name.")
	}

	// return shim.Error("Invalid Smart Contract function name.")
}
func (s *SmartContract) invokeCertificateData(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	var certificateData = CertificateData{
		 IssuerName: args[0],
		 IssuerDate: args[1],
		 CertificateType: args[2],
		 VerifierEmail: args[3],
		 VerifierId: args[4],
		 CertificateId: args[5],
		 FileHash: args[6],
		 FilePath: args[7],
		 PlaceOfIssuance: args[8],
		 CreatedBy: args[9], 
		 UpdatedBy: args[10], 
		 LastUpdatedTimestamp: args[11],
	}
	certificateDataJSON, err := json.Marshal(certificateData)
	if err != nil {
		return shim.Error(err.Error())
	}

	 APIstub.PutState(certificateData.CertificateId, certificateDataJSON)
	return shim.Success(certificateDataJSON)

}

func (s *SmartContract) storeCertificateKey(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	var certificateKey = StoreCertificateKey{
	
		 VerifierId: args[0],
		 CertificateId: args[1],
	}
	certificateKeyJSON, err := json.Marshal(certificateKey)
	if err != nil {
		return shim.Error(err.Error())
	}

	 APIstub.PutState(certificateKey.VerifierId, certificateKeyJSON)
	return shim.Success(certificateKeyJSON)

}


func (s *SmartContract) queryCertificateData(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	carAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(carAsBytes)
}

func (s *SmartContract) queryAllCertificates(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := ""
	endKey := ""

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllCars:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
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
