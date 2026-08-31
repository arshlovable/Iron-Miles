import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';

const C = {
  gold: '#E0C27C',
  goldDark: '#B89B5F',
  white: '#FFFFFF',
  borderSubtle: '#2A2820',
  surfaceEl: '#1C1A17',
};

type ImageCrop = {
  scale: number;
  offsetY: number;
};

export type CrewMember = {
  name: string;
  role: string;
  image?: ImageSourcePropType;
  crop?: ImageCrop;
};

const IRON_MILES_CREW: CrewMember[] = [
  {
    name: 'Arshmit Gill',
    role: 'Trucker · Founder',
    image: require('../../assets/crew/arshmit-gill.png'),
    crop: { scale: 1.06, offsetY: -5 },
  },
  {
    name: 'Kevin Hamid',
    role: 'Trainer · Co-founder',
    image: require('../../assets/crew/kevin-hamid.png'),
    crop: { scale: 1.28, offsetY: -11 },
  },
];

type ExerciseCrewRowProps = {
  members?: CrewMember[];
};

const HEADSHOT_SIZE = 54;

function CrewProfile({ name, role, image, crop }: CrewMember) {
  const scale = crop?.scale ?? 1;
  const offsetY = crop?.offsetY ?? 0;
  const imageSize = HEADSHOT_SIZE * scale;
  const inset = (HEADSHOT_SIZE - imageSize) / 2;

  return (
    <View style={s.profile}>
      {image ? (
        <View style={s.headshotClip}>
          <Image
            source={image}
            style={{
              width: imageSize,
              height: imageSize,
              position: 'absolute',
              left: inset,
              top: inset + offsetY,
            }}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={s.headshotPlaceholder} />
      )}
      <Text style={s.name}>{name}</Text>
      <Text style={s.role}>({role})</Text>
    </View>
  );
}

export default function ExerciseCrewRow({ members = IRON_MILES_CREW }: ExerciseCrewRowProps) {
  return (
    <View style={s.container}>
      <Text style={s.header}>THE CREW</Text>
      <View style={s.row}>
        {members.map((member) => (
          <CrewProfile key={member.name} {...member} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  header: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    gap: 32,
  },
  profile: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 150,
  },
  headshotClip: {
    width: HEADSHOT_SIZE,
    height: HEADSHOT_SIZE,
    borderRadius: HEADSHOT_SIZE / 2,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    overflow: 'hidden',
  },
  headshotPlaceholder: {
    width: HEADSHOT_SIZE,
    height: HEADSHOT_SIZE,
    borderRadius: HEADSHOT_SIZE / 2,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    backgroundColor: C.surfaceEl,
  },
  name: {
    color: C.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  role: {
    color: C.goldDark,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});
