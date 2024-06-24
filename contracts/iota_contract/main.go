package main

import (
	"fmt"

	"github.com/iotaledger/iota.go/v2/api"
	"github.com/iotaledger/iota.go/v2/tpkg"
)

func main() {
	// Подключение к узлу IOTA
	nodeURL := "https://chrysalis-nodes.iota.org"
	iotaAPI, err := api.ComposeAPI(api.HTTPClientSettings{URI: nodeURL})
	if err != nil {
		panic(err)
	}

	// Пример отправки и получения сообщений
	address := "YOUR_IOTA_ADDRESS_HERE"
	message := "Hello, IOTA!"

	// Отправка сообщения
	sendMessage(iotaAPI, address, message)

	// Получение сообщений
	getMessages(iotaAPI, address)
}

func sendMessage(iotaAPI *api.API, address string, message string) {
	bundle, err := iotaAPI.PrepareTransfers(tpkg.EmptySeed, api.PrepareTransfersOptions{
		Transfers: []api.Transfer{
			{
				Address: address,
				Value:   0,
				Message: message,
			},
		},
	})
	if err != nil {
		panic(err)
	}

	_, err = iotaAPI.SendTrytes(bundle, 2, 14)
	if err != nil {
		panic(err)
	}

	fmt.Println("Message sent successfully!")
}

func getMessages(iotaAPI *api.API, address string) {
	txs, err := iotaAPI.FindTransactionObjects(api.FindTransactionsQuery{Addresses: []string{address}})
	if err != nil {
		panic(err)
	}

	for _, tx := range txs {
		fmt.Printf("Message: %s\n", tx.SignatureMessageFragment)
	}
}
