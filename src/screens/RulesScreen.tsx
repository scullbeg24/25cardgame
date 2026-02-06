import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import NavigationHeader from "../components/NavigationHeader";
import { colors, shadows, borderRadius } from "../theme";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function Section({ title, children, defaultExpanded = false }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <View style={{ marginBottom: 16 }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{
          backgroundColor: colors.background.surface,
          padding: 16,
          borderRadius: borderRadius.lg,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          ...shadows.extruded.small,
          borderWidth: 1,
          borderColor: expanded ? colors.gold.dark : colors.softUI.border,
          borderBottomLeftRadius: expanded ? 0 : borderRadius.lg,
          borderBottomRightRadius: expanded ? 0 : borderRadius.lg,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gold.light }}>
          {title}
        </Text>
        <Text style={{ color: colors.gold.primary, fontSize: 18 }}>
          {expanded ? "−" : "+"}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View
          style={{
            backgroundColor: colors.background.primary,
            padding: 16,
            borderBottomLeftRadius: borderRadius.lg,
            borderBottomRightRadius: borderRadius.lg,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: colors.gold.dark,
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: colors.gold.light, fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: colors.text.secondary, fontSize: 15, lineHeight: 24, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.background.surface, padding: 12, borderRadius: borderRadius.md, marginVertical: 8, borderLeftWidth: 3, borderLeftColor: colors.gold.primary }}>
      <Text style={{ color: colors.text.secondary, fontSize: 14, lineHeight: 22, fontStyle: "italic" }}>
        <Text style={{ fontWeight: "600", color: colors.gold.light }}>Note: </Text>
        {children}
      </Text>
    </View>
  );
}

function Remember({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.background.surface, padding: 12, borderRadius: borderRadius.md, marginVertical: 8, borderLeftWidth: 3, borderLeftColor: colors.suits.hearts }}>
      <Text style={{ color: colors.text.primary, fontSize: 14, lineHeight: 22, fontWeight: "500" }}>
        <Text style={{ fontWeight: "600", color: colors.suits.hearts }}>Remember: </Text>
        {children}
      </Text>
    </View>
  );
}

function CardRankingTable({ title, rankings }: { title: string; rankings: { suit: string; suitColor: string; cards: string }[] }) {
  return (
    <View style={{ marginVertical: 8 }}>
      <Text style={{ color: colors.gold.light, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>{title}</Text>
      {rankings.map((row, index) => (
        <View key={index} style={{ flexDirection: "row", marginBottom: 4, alignItems: "flex-start" }}>
          <Text style={{ color: row.suitColor, fontSize: 14, width: 80, fontWeight: "500" }}>{row.suit}</Text>
          <Text style={{ color: colors.text.secondary, fontSize: 14, flex: 1, lineHeight: 20 }}>{row.cards}</Text>
        </View>
      ))}
    </View>
  );
}

export default function RulesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background.secondary }}>
        <NavigationHeader title="How to Play 25" />
      </SafeAreaView>
      
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: 24 }} contentContainerStyle={{ paddingBottom: 24 }}>

          <Section title="Objective">
            <Paragraph>
              Be the first team to score 25 points (5 tricks × 5 points each).
              The first team to win the required number of rounds wins the game.
              The number of rounds depends on the table settings.
            </Paragraph>
          </Section>

          <Section title="The Cards">
            <SubHeading>Card Values</SubHeading>
            <Paragraph>
              Each card has a specific value and rank that determines its strength in the game.
            </Paragraph>
            
            <SubHeading>Numerical Cards</SubHeading>
            <Paragraph>
              Numerical cards (1-10) are ranked in ascending order for the{" "}
              <Text style={{ color: colors.suits.hearts }}>Hearts ♥</Text> and{" "}
              <Text style={{ color: colors.suits.diamonds }}>Diamonds ♦</Text> suits, 
              and ranked in descending order for the{" "}
              <Text style={{ color: colors.suits.clubs }}>Clubs ♣</Text> and{" "}
              <Text style={{ color: colors.suits.spades }}>Spades ♠</Text> suits.
            </Paragraph>
            
            <Note>
              The value of an Ace is 1, except the Ace of Hearts which is always a trump.
            </Note>
            
            <Remember>
              Highest in red (Hearts / Diamonds){"\n"}
              Lowest in black (Clubs / Spades)
            </Remember>
            
            <SubHeading>Non-Trump Face Cards</SubHeading>
            <Paragraph>
              Face cards are ranked in descending order for all suits: King (highest), followed by Queen, and finally the Jack (or Knave).
            </Paragraph>
          </Section>

          <Section title="Trump Card">
            <Paragraph>
              After the dealer finishes dealing cards to each player, they turn the next card and place it face up on top of the deck. This card is known as the trump card.
            </Paragraph>
            <Paragraph>
              This card is very important and determines the potential strength of a player's hand.
            </Paragraph>
          </Section>

          <Section title="Trump Cards">
            <Paragraph>
              All cards that are of the same suit as the trump (known as trump cards) will beat all cards from all other suits, except for the Ace of Hearts.
            </Paragraph>
            
            <Note>
              5 of trumps becomes the best card and cannot be beaten, followed by the Jack of trumps. The Ace of Hearts is always the 3rd best card in any game. The Ace of trumps is the next best card followed by King and Queen of trumps. The numerical trump cards rankings are the same as usual (highest in red, lowest in black).
            </Note>
            
            <Remember>
              Any trump card will beat a non-trump card.{"\n\n"}
              In a trump vs trump situation, standard rankings apply except for the 5, Jack, Ace of Hearts, and Ace of trumps (see note above).
            </Remember>
          </Section>

          <Section title="Trump Hierarchy">
            <Paragraph>
              When playing with trump cards, the hierarchy from highest to lowest is:
            </Paragraph>
            <Text style={{ color: colors.text.primary, fontSize: 15, lineHeight: 28, marginTop: 8 }}>
              1. 5 of trumps (highest – 5♥ when hearts are trump, 5 of trump suit otherwise){"\n"}
              2. Jack of trump{"\n"}
              3. <Text style={{ color: colors.suits.hearts, fontWeight: "600" }}>A♥</Text> (always 3rd best){"\n"}
              4. Ace of trump{"\n"}
              5. King of trump{"\n"}
              6. Queen of trump{"\n"}
              7. Numerical cards (highest in red, lowest in black)
            </Text>
          </Section>

          <Section title="Following Suit">
            <SubHeading>Suit Card</SubHeading>
            <Paragraph>
              The first card played in each lift sets the suit card and can only be beaten by a higher value card of that suit (suit cards) or a trump card.
            </Paragraph>
            
            <Paragraph>
              Any card can be played first to set the suit. You must play a suit card (a card of the same suit as the first card played in each lift) if you have it.
            </Paragraph>
            
            <Paragraph>
              A trump card can also be played and will beat any suit card. If you do not have a suit card (and do not want to play a trump card), you may play a card from any other suit, however it will not beat the suit card.
            </Paragraph>
          </Section>

          <Section title="Reneging">
            <Paragraph>
              If a trump card is played first, you must play a trump card if you have it with the following exceptions:
            </Paragraph>
            
            <View style={{ backgroundColor: colors.background.surface, padding: 12, borderRadius: borderRadius.md, marginVertical: 8 }}>
              <Text style={{ color: colors.gold.light, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Exception</Text>
              <Text style={{ color: colors.text.secondary, fontSize: 14, lineHeight: 22 }}>
                The 5, the Jack, and the Ace of Hearts can be held back (reneged) if any lower trump card leads.
              </Text>
            </View>
            
            <Paragraph>
              • If the <Text style={{ color: colors.suits.hearts, fontWeight: "500" }}>Ace of Hearts</Text> is played first, you must play a trump card (if you have one) but can hold the Jack of trumps and/or the 5 of trumps.
            </Paragraph>
            
            <Paragraph>
              • If the <Text style={{ fontWeight: "500" }}>Jack of trumps</Text> is played first, you must play a trump card (if you have one), including the Ace of Hearts, but can renege the 5 of trumps.
            </Paragraph>
            
            <Paragraph>
              • If the <Text style={{ fontWeight: "500" }}>5 of trumps</Text> is played first, you must play a trump card if you have it.
            </Paragraph>
          </Section>

          <Section title="Game Flow">
            <SubHeading>The Deal</SubHeading>
            <Paragraph>
              The dealer will give each player 5 cards in two sets. First, they will give each player (starting to the dealer's left) 3 cards, followed by a set of 2 cards in a clockwise rotation.
            </Paragraph>
            <Paragraph>
              The dealer will then deal the next card and place it face up on the deck - this is the trump card.
            </Paragraph>
            
            <SubHeading>Robbing with the Ace</SubHeading>
            <Paragraph>
              A player who has the Ace of trumps may (on their turn to play their first card) take up the trump card by replacing it with a card of lesser value.
            </Paragraph>
            
            <Note>
              If the dealer turns an Ace as a trump card, they must take up that card before the game starts as per the above procedure.
            </Note>
          </Section>

          <Section title="Scoring">
            <Paragraph>
              The player to the dealer's left starts the play and it continues clockwise until each player has played one card. The player with the best value card wins the lift and receives 5 points.
            </Paragraph>
            
            <Paragraph>
              The winning player then resumes the game by playing a card and so on...
            </Paragraph>
            
            <Paragraph>
              The first player to score 25 (5 lifts) wins the round.
            </Paragraph>
            
            <Paragraph>
              To win a game you must win the number of rounds specified in the table that was created. The number of rounds in a game depends on the table settings.
            </Paragraph>
            
            <View style={{ backgroundColor: colors.background.surface, padding: 12, borderRadius: borderRadius.md, marginTop: 12 }}>
              <Text style={{ color: colors.gold.light, fontSize: 14, fontWeight: "600", marginBottom: 4 }}>Lift</Text>
              <Text style={{ color: colors.text.secondary, fontSize: 14, lineHeight: 22 }}>
                One round of cards from all the players. The player with the best value card wins the lift = 5 points.
              </Text>
            </View>
          </Section>

          <Section title="Card Rankings">
            <CardRankingTable 
              title="Trump Suit Rankings (Best → Worst)"
              rankings={[
                { suit: "Hearts:", suitColor: colors.suits.hearts, cards: "5  J  A♥  K  Q  10  9  8  7  6  4  3  2" },
                { suit: "Clubs:", suitColor: colors.suits.clubs, cards: "5  J  A♥  A  K  Q  2  3  4  6  7  8  9  10" },
                { suit: "Diamonds:", suitColor: colors.suits.diamonds, cards: "5  J  A♥  A  K  Q  10  9  8  7  6  4  3  2" },
                { suit: "Spades:", suitColor: colors.suits.spades, cards: "5  J  A♥  A  K  Q  2  3  4  6  7  8  9  10" },
              ]}
            />
            
            <View style={{ height: 16 }} />
            
            <CardRankingTable 
              title="Non-Trump Suit Rankings (Best → Worst)"
              rankings={[
                { suit: "Hearts:", suitColor: colors.suits.hearts, cards: "K  Q  J  10  9  8  7  6  5  4  3  2" },
                { suit: "Clubs:", suitColor: colors.suits.clubs, cards: "K  Q  J  A  2  3  4  5  6  7  8  9  10" },
                { suit: "Diamonds:", suitColor: colors.suits.diamonds, cards: "K  Q  J  10  9  8  7  6  5  4  3  2  A" },
                { suit: "Spades:", suitColor: colors.suits.spades, cards: "K  Q  J  A  2  3  4  5  6  7  8  9  10" },
              ]}
            />
          </Section>

        </ScrollView>
      </LinearGradient>
    </View>
  );
}
