import { useEffect, useState } from "react"
import { View, Text, Alert, FlatList } from "react-native"

import { Plus } from "lucide-react-native"

import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Modal } from "@/components/modal"
import { ParticipantProps, Participant } from "@/components/participant"
import { TripLink, TripLinkProps } from "@/components/tripLink"

import { linksServer } from "@/server/links-server"
import { participantsServer } from "@/server/participants-server"
import { colors } from "@/styles/colors"
import { validateInput } from "@/utils/validateInput"

export function Details({ tripId }: { tripId: string }) {
  const [isCreatingLinkTrip, setIsCreatingLinkTrip] = useState(false)

  const [showNewLinkModal, setShowNewLinkModal] = useState(false)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")

  const [links, setLinks] = useState<TripLinkProps[]>([])
  const [participants, setParticipants] = useState<ParticipantProps[]>([])

  function resetNewLinkFields() {
    setLinkTitle("")
    setLinkUrl("")
    setShowNewLinkModal(false)
  }

  async function handleCreateLinkTrip() {
    try {
      if (!linkTitle.trim()) {
        return Alert.alert("Link", "informe um título para o link.")
      }

      if (!validateInput.url(linkUrl.trim())) {
        return Alert.alert("Link", "Link inválido.")
      }

      setIsCreatingLinkTrip(false)

      await linksServer.create({
        tripId,
        title: linkTitle,
        url: linkUrl
      })

      Alert.alert("Link", "Link adicionado com sucesso.")
      resetNewLinkFields()

      await getTripLinks()
    } catch (error) {
      console.error(error)
    } finally {
      setIsCreatingLinkTrip(false)
    }
  }

  async function getTripLinks() {
    try {
      const links = await linksServer.getLinksByTripId(tripId)

      setLinks(links)
    } catch (error) {
      console.error(error)
    }
  }

  async function getTripParticipants() {
    try {
      const participants = await participantsServer.getByTripId(tripId)

      setParticipants(participants)
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    getTripLinks()
    getTripParticipants()
  }, [])

  return (
    <View className="flex-1 mt-10">
      <Text className="text-zinc-50 text-2xl font-semibold mb-2">
        Links importantes
      </Text>

      <View className="flex-1">
        {links.length > 0 ? (
          <FlatList
            data={links}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TripLink data={item} />}
            contentContainerClassName="gap-4"
          />
        ) : (
          <Text className="text-zinc-400 font-regular text-base mt-2 mb-6">
            Nenhum link adicionado
          </Text>
        )}

        <Button variant="secondary" onPress={() => setShowNewLinkModal(true)}>
          <Plus color={colors.zinc[200]} size={20} />
          <Button.Title>Adicionar link</Button.Title>
        </Button>
      </View>

      <View className="flex-1 border-t border-zinc-800 mt-6">
        <Text className="text-zinc-50 text-2xl font-semibold my-6">
          Convidados
        </Text>

        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Participant data={item} />}
          contentContainerClassName="gap-4 pb-44"
        />
      </View>

      <Modal
        title="Adicionar link"
        subtitle="Adicionar um novo link"
        visible={showNewLinkModal}
        onClose={() => setShowNewLinkModal(false)}
      >
        <View className="gap-2 mb-3">
          <Input variant="secondary">
            <Input.Field
              onChangeText={setLinkTitle}
              placeholder="Título"
              autoCapitalize="none"
            />
          </Input>
          <Input variant="secondary">
            <Input.Field
              onChangeText={setLinkUrl}
              placeholder="URL"
              autoCapitalize="none"
            />
          </Input>
        </View>

        <Button
          isLoading={isCreatingLinkTrip}
          variant="primary"
          onPress={handleCreateLinkTrip}
        >
          <Button.Title>Adicionar</Button.Title>
        </Button>
      </Modal>
    </View>
  )
}
