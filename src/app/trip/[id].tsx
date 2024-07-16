import { useEffect, useState } from "react"
import { View, TouchableOpacity, Keyboard, Alert, Text } from "react-native"
import { DateData } from "react-native-calendars"

import dayjs from "dayjs"
import { router, useLocalSearchParams } from "expo-router"
import {
  CalendarRange,
  Info,
  MapPin,
  Settings2,
  Calendar as IconCalendar,
  User,
  Mail
} from "lucide-react-native"

import { Button } from "@/components/button"
import { Calendar } from "@/components/calendar"
import { Input } from "@/components/input"
import { Loading } from "@/components/loading"
import { Modal } from "@/components/modal"

import { participantsServer } from "@/server/participants-server"
import { TripDetails, tripServer } from "@/server/trip-server"
import { tripStorage } from "@/storage/trip"
import { colors } from "@/styles/colors"
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils"
import { validateInput } from "@/utils/validateInput"

import { Activities } from "./activities"
import { Details } from "./details"

export type TripData = TripDetails & { when: string }

enum ModalState {
  NONE = 0,
  UPDATE_TRIP = 2,
  CALENDAR = 1,
  CONFIRM_ATTENDANCE = 3
}

function Trip() {
  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)
  const [isConfirmingAttendance, setIsConfirmingAttendance] = useState(false)

  const [tripDetails, setTripDetails] = useState({} as TripData)
  const [option, setOption] = useState<"activity" | "details">("activity")
  const [destination, setDestination] = useState("")
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")

  const [showModal, setShowModal] = useState(ModalState.NONE)

  const { id: tripId, participant } = useLocalSearchParams<{
    id: string
    participant?: string
  }>()

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true)

      if (participant) {
        setShowModal(ModalState.CONFIRM_ATTENDANCE)
      }

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

  async function handleConfirmAttendance() {
    try {
      if (!participant || !tripId) {
        return
      }

      if (!guestName.trim() || !guestEmail.trim()) {
        return Alert.alert(
          "Confirmar presença",
          "Preencha todos os campos para confirmar presença."
        )
      }

      if (!validateInput.email(guestEmail.trim())) {
        return Alert.alert("Confirmar presença", "Email inválido.")
      }

      setIsConfirmingAttendance(true)

      await participantsServer.confirmTripByParticipantId({
        participantId: participant,
        name: guestName,
        email: guestEmail
      })

      Alert.alert("Confirmar presença", "Presença confirmada com sucesso!")

      await tripStorage.save(tripId)

      setShowModal(ModalState.NONE)
    } catch (error) {
      console.error(error)
      Alert.alert("Confirmar presença", "Erro ao confirmar presença.")
    } finally {
      setIsConfirmingAttendance(false)
    }
  }

  async function handleRemoveTrip() {
    try {
      Alert.alert(
        "Remover Viagem",
        "Tem certeza que deseja remover esta viagem?",
        [
          {
            text: "Não",
            style: "cancel"
          },
          {
            text: "Sim",
            onPress: async () => {
              await tripStorage.remove()
              router.navigate("/")
            }
          }
        ]
      )
    } catch (error) {
      console.error(error)
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
          className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
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

        <TouchableOpacity activeOpacity={0.7} onPress={handleRemoveTrip}>
          <Text className="text-red-400 text-center mt-6">Remover viagem</Text>
        </TouchableOpacity>
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

      <Modal
        title="Confirmar presença"
        visible={showModal === ModalState.CONFIRM_ATTENDANCE}
      >
        <View className="gap-4 mt-4">
          <Text className="text-zinc-400 font-regular leading-6 my-2">
            Você foi convidado(a) para uma viagem para{" "}
            <Text className="font-semibold text-zinc-100">
              {tripDetails.destination}
            </Text>{" "}
            durante as datas de{" "}
            <Text className="font-semibold text-zinc-100">
              {dayjs(tripDetails.starts_at).format("DD [de] MMMM [de] YYYY")} a{" "}
              {dayjs(tripDetails.ends_at).format("DD [de] MMMM [de] YYYY")}.{" "}
              {"\n\n"}
            </Text>
            <Text>
              Para confirmar a sua presença, preencha os dados abaixo:
            </Text>
          </Text>

          <Input variant="secondary">
            <User color={colors.zinc[400]} size={20} />
            <Input.Field
              onChangeText={setGuestName}
              placeholder="Nome completo"
            />
          </Input>
          <Input variant="secondary">
            <Mail color={colors.zinc[400]} size={20} />
            <Input.Field placeholder="Email" onChangeText={setGuestEmail} />
          </Input>

          <Button
            variant="primary"
            onPress={handleConfirmAttendance}
            isLoading={isConfirmingAttendance}
          >
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}

export default Trip
