import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, Keyboard, Alert } from "react-native"
import { DateData } from "react-native-calendars"

import dayjs from "dayjs"
import { router, useLocalSearchParams } from "expo-router"
import {
  CalendarRange,
  Info,
  MapPin,
  Settings2,
  Calendar as IconCalendar
} from "lucide-react-native"

import { Button } from "@/components/button"
import { Calendar } from "@/components/calendar"
import { Input } from "@/components/input"
import { Loading } from "@/components/loading"
import { Modal } from "@/components/modal"

import { TripDetails, tripServer } from "@/server/trip-server"
import { colors } from "@/styles/colors"
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils"

import { Activities } from "./activities"
import { Details } from "./details"

export type TripData = TripDetails & { when: string }

enum ModalState {
  NONE = 0,
  UPDATE_TRIP = 2,
  CALENDAR = 1
}

function Trip() {
  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)

  const [tripDetails, setTripDetails] = useState({} as TripData)
  const [option, setOption] = useState<"activity" | "details">("activity")
  const [destination, setDestination] = useState("")
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected)

  const [showModal, setShowModal] = useState(ModalState.NONE)

  const tripId = useLocalSearchParams<{ id: string }>().id

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true)

      if (!tripId) {
        return router.back()
      }

      const trip = await tripServer.getById(tripId)

      const maxLengthDestination = 14

      const destination =
        trip.destination.length > maxLengthDestination
          ? trip.destination.slice(0, maxLengthDestination) + "..."
          : trip.destination

      const starts_at = dayjs(trip.starts_at).format("DD")
      const ends_at = dayjs(trip.ends_at).format("DD")
      const month = dayjs(trip.ends_at).format("MMM")

      setDestination(trip.destination)

      setTripDetails({
        ...trip,
        when: `${destination} - de ${starts_at} a ${ends_at} de ${month}.`
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingTrip(false)
    }
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay
    })

    setSelectedDates(dates)
  }

  async function handleUpdateTrip() {
    try {
      if (!tripId) {
        return
      }

      if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
        return Alert.alert(
          "Atualizar Viagem",
          "Além de preencher o campo de destino, as datas de partida e chegada devem ser preenchidas."
        )
      }

      setIsUpdatingTrip(true)

      await tripServer.update({
        id: tripId,
        destination,
        starts_at: dayjs(selectedDates.startsAt.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt.dateString).toString()
      })

      Alert.alert("Atualizar Viagem", "Viagem atualizada com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            setShowModal(ModalState.NONE)
            getTripDetails()
          }
        }
      ])
    } catch (error) {
      console.error(error)
    } finally {
      setIsUpdatingTrip(false)
    }
  }

  useEffect(() => {
    getTripDetails()
  }, [])

  if (isLoadingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 px-5 pt-16">
      <Input variant="tertiary">
        <MapPin color={colors.zinc[400]} size={20} />
        <Input.Field value={tripDetails.when} readOnly />
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-9 h-9 bg-zinc-800 itens justify-center rounded"
          onPress={() => setShowModal(ModalState.UPDATE_TRIP)}
        >
          <Settings2 color={colors.zinc[400]} size={20} />
        </TouchableOpacity>
      </Input>

      {option === "activity" ? (
        <Activities tripDetails={tripDetails} />
      ) : (
        <Details tripId={tripDetails.id} />
      )}

      <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
        <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
          <Button
            className="flex-1"
            onPress={() => setOption("activity")}
            variant={option === "activity" ? "primary" : "secondary"}
          >
            <CalendarRange
              color={
                option === "activity" ? colors.lime[950] : colors.zinc[200]
              }
              size={20}
            />
            <Button.Title>Atividades</Button.Title>
          </Button>

          <Button
            className="flex-1"
            onPress={() => setOption("details")}
            variant={option === "details" ? "primary" : "secondary"}
          >
            <Info
              color={option === "details" ? colors.lime[950] : colors.zinc[200]}
              size={20}
            />
            <Button.Title>Detalhes</Button.Title>
          </Button>
        </View>
      </View>

      <Modal
        title="Atualizar viagem"
        subtitle="Somente o criador da viagem pode atualiza-la."
        visible={showModal === ModalState.UPDATE_TRIP}
        onClose={() => setShowModal(ModalState.NONE)}
      >
        <View className="gap-2 my-4">
          <Input variant="secondary">
            <MapPin color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Para onde?"
              onChangeText={setDestination}
              value={destination}
            />
          </Input>

          <Input variant="secondary">
            <IconCalendar color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Quando?"
              value={selectedDates.formatDatesInText}
              onPressIn={() => setShowModal(ModalState.CALENDAR)}
              onFocus={() => Keyboard.dismiss()}
            />
          </Input>

          <Button
            variant="primary"
            onPress={handleUpdateTrip}
            isLoading={isUpdatingTrip}
          >
            <Button.Title>Atualizar</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Selecionar datas"
        subtitle="Selecione a data de ida o volta da viagem"
        visible={showModal === ModalState.CALENDAR}
        onClose={() => setShowModal(ModalState.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar
            minDate={dayjs().toISOString()}
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
          />

          <Button onPress={() => setShowModal(ModalState.UPDATE_TRIP)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}

export default Trip